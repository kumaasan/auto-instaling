import puppeteer from 'puppeteer';
import fs from 'fs';
import chalk from 'chalk'

let dictionary = [];

try {
  dictionary = JSON.parse(fs.readFileSync("dictionary.json", "utf8"));
} catch {
  dictionary = [];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dumpButtons(page, selector) {
  const buttons = await page.$$(selector);

  console.log("znalazlem " + selector + " , " + buttons.length);

  const htmlArray = await Promise.all(
    buttons.map(btn => page.evaluate(el => el.outerHTML, btn))
  );
  const textArray = await Promise.all(
    buttons.map(btn => page.evaluate(el => el.innerText, btn))
  );

  console.log("HTML przycisków:", htmlArray);
  console.log("Teksty przycisków:", textArray);
}

function getGermanWord(word) {
  const wordPair = dictionary.find(item => item.polish === word);
  return wordPair ? wordPair.german : null;
}

async function clickButtonByText(page, selector, text) {
  const buttons = await page.$$(selector);
  for (const btn of buttons) {
    const btnText = await page.evaluate(el => el.innerText.trim(), btn);
    if (btnText === text) {
      try {
        await page.evaluate(el => el.click(), btn);
      } catch {}
      return true;
    }
  }
  return false;
}

async function clickDontKnowIfVisible(page) {
  try {
    const isVisible = await page.$eval('#dont_know_new', el => {
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });

    if (isVisible) {
      console.log("Klikam 'Nie wiem'");
      const dontKnowBtn = await page.$('#dont_know_new');
      await page.evaluate(el => el.click(), dontKnowBtn);
      await sleep(500);
      await clickButtonByText(page, '#next_word', "Pomiń");
      await sleep(500);
      return true;
    }
  } catch {}
  return false;
}

function saveToDictionary() {
  fs.writeFileSync("dictionary.json", JSON.stringify(dictionary, null, 2), "utf8");
  console.log("zapisano nowe słowo")
}

const browser = await puppeteer.launch();
async function runSession(daneLogowania) {
  console.log('sesja sie zaczyna')
  console.log(chalk.green("======== " + daneLogowania.name+ " ========"));
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--mute-audio"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  await page.goto('https://instaling.pl');

  // cookies
  await page.waitForSelector('.fc-button-label');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.fc-button-label'));
    const consentBtn = buttons.find(b => b.innerText.includes('Consent'));
    if (consentBtn) consentBtn.click();
  });
  await sleep(500);

  // logowanie
  await page.waitForSelector('.btn-login');
  await page.click('.btn-login');

  await page.waitForSelector('#log_email');
  await page.type('#log_email', daneLogowania.login, { delay: 50 });

  await page.waitForSelector('#log_password');
  await page.type('#log_password', daneLogowania.password, { delay: 50 });

  await page.waitForSelector('.btn.btn-primary.w-100.mt-3.mb-3');
  await page.click('.btn.btn-primary.w-100.mt-3.mb-3');

  //streak button
  try{
    await page.waitForSelector('#streak-button-close');
    await page.click('#streak-button-close');

  }catch{
    console.log('nie ma streak buttona')
  }
  // rozpoczęcie sesji
  await page.waitForSelector('.btn.btn-instaling.btn-start-session', { visible: true });
  await page.click('.btn.btn-instaling.btn-start-session');

  await sleep(2000);

  try {
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', 'Zacznij swoją codzienną sesję');
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', 'Rozpocznij sesję');
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', 'Kontynuuj sesję');
    await sleep(1500);
  } catch {}

  let counter = 0;
  while (true) {
    while(await clickDontKnowIfVisible(page)){
      console.log('kliknieto dont know button')
    }

    let polishWord;
    try {
      await page.waitForSelector('.translation', { visible: true, timeout: 2000 });
      polishWord = await page.$eval('.translation', el => {
        let s = el.innerText || '';
        s = s.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u2060]/g, '');
        s = s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        try { s = s.normalize('NFC'); } catch(e) {}
        return s;
      });
    } catch {
      await page.waitForSelector('#return_mainpage', { visible: true, timeout: 2000 });
      await page.click('#return_mainpage');
      await browser.close();
      break;
    }

    let germanWord = getGermanWord(polishWord);

    await page.evaluate(() => { document.querySelector('#answer').value = ''; });

    if (!germanWord) {
      await page.type('#answer', "nie wiem", { delay: 10 });
      await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
      await page.waitForSelector('#word', { visible: true });
      const nieznaneNiemieckieSlowo = await page.$eval('#word', el => el.innerText.trim());
      console.log(`${polishWord} -> ${nieznaneNiemieckieSlowo}`);
      dictionary.push({ polish: polishWord, german: nieznaneNiemieckieSlowo });
      saveToDictionary();
    } else {
      counter++;
      console.log(`${counter}. ${polishWord} -> ${germanWord}`);
      await sleep(500);
      await page.type('#answer', germanWord, { delay: 10 });
      await sleep(500);
      await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
      await sleep(500);

      // Pobierz poprawną odpowiedź ze strony
      let correctAnswer = '';
      try {
        correctAnswer = await page.$eval('#word', el => el.innerText.trim());
      } catch {}

      // Porównaj to, co wpisałeś z tym, co pokazuje strona
      if (correctAnswer && correctAnswer !== germanWord) {
        console.log(chalk.red(`❌ BŁĄD: wpisano "${germanWord}" ale poprawnie: "${correctAnswer}"`));

        // Kliknij "Dalej"
        await page.waitForSelector('#next_word', { visible: true });
        await page.click('#next_word');
        await sleep(1000);

        // Wyczyść input i wpisz poprawną odpowiedź
        await page.evaluate(() => { document.querySelector('#answer').value = ''; });
        await sleep(500);
        console.log(chalk.green(`✓ Wpisuję poprawną odpowiedź: "${correctAnswer}"`));
        await page.type('#answer', correctAnswer, { delay: 10 });
        await sleep(500);
        await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
      }
    }
    await page.waitForSelector('#next_word', { visible: true });
    await page.click('#next_word');
    await sleep(1000);
  }
}

const users = [
  /*ja*/ { login: "5pg186772", password: "iteri", name: "mariusz" },
  /*ja*/ { login: "5pg186772", password: "iteri", name: "mariusz" },
  /*michal*/ {login: "5pg171917", password: "kmspe", name: "michał" },
  /*michal*/ {login: "5pg171917", password: "kmspe", name: "michał" },
  /*wojtek*/ { login: "5p2144633", password: "tprns", name: "wojtek" },
  /*wojtek*/ { login: "5p2144633", password: "tprns", name: "wojtek" }
];

for (const user of users) {
  await runSession(user);
  await browser.close();
}

console.log("Wszystkie sesje zakończone.");
process.exit(0)
await browser.close();
