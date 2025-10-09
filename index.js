import puppeteer from 'puppeteer';
import fs from 'fs';

let dictionary = [];

try {
  dictionary = JSON.parse(fs.readFileSync("dictionary.json", "utf8"));
} catch {
  dictionary = [];
}

const daneLogowania = {
  login: "5pg186772",
  password: "iteri"
};

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

function saveToDictionary() {
  fs.writeFileSync("dictionary.json", JSON.stringify(dictionary, null, 2), "utf8");
  console.log("dodano nowy wyraz do słownika")
}

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ["--start-maximized"],
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

await sleep(3000);

try{
  console.log("cos sie dzieje")
  await dumpButtons(page, '.btn.btn-instaling.btn-start-session')
  await clickButtonByText(page ,'.btn.btn-instaling.btn-start-session', 'Rozpocznij sesję');

}catch (err){
  console.log(err);
}
// await dumpButtons(page,'.btn.btn-instaling.btn-start-session')
// rozpoczęcie sesji
try{
  await page.waitForSelector('#streak-button-close');
  await page.click('#streak-button-close');
}catch{}

await sleep(3000)
await page.waitForSelector('.btn.btn-instaling.btn-start-session', { visible: true });
await page.click('.btn.btn-instaling.btn-start-session');

await sleep(2000);

try {
  await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', 'Zacznij swoją codzienną sesję');
  await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', 'Kontynuuj sesję');
  await sleep(1500);
} catch {}

while (true) {
  try {
    const dontKnowBtn = await page.waitForSelector('#dont_know_new', { visible: true, timeout: 1000 })
      .catch(() => null);

    if (dontKnowBtn) {
      await dontKnowBtn.click();
      await sleep(100);
      await clickButtonByText(page, '#next_word', "Pomiń");
    }
  } catch (err) {
    console.error("Błąd przy próbie kliknięcia 'Nie wiem':", err);
  }


  let polishWord;
  try {
    await page.waitForSelector('.translation', { visible: true, timeout: 2000 });
    polishWord = await page.$eval('.translation', el => el.innerText.trim());
  } catch {
    await clickButtonByText(page, '#return_mainpage', "Powrót na stronę główną");
    break;
  }

  let germanWord = getGermanWord(polishWord);

  await page.evaluate(() => { document.querySelector('#answer').value = ''; });

  if (!germanWord) {
    await sleep(1000)
    await page.type('#answer', "nie wiem", { delay: 50 });
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
    await page.waitForSelector('#word', { visible: true });
    const nieznaneNiemieckieSlowo = await page.$eval('#word', el => el.innerText.trim());
    console.log(`${polishWord} -> ${nieznaneNiemieckieSlowo}`);
    dictionary.push({ polish: polishWord, german: nieznaneNiemieckieSlowo });
    saveToDictionary();
  } else {
    console.log(`${polishWord} -> ${germanWord}`);
    await sleep(1000)
    await page.type('#answer', germanWord, { delay: 50 });
    await sleep(500);
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
  }
  await sleep(1000)
  await page.waitForSelector('#next_word', { visible: true });
  await page.click('#next_word');
  await sleep(1000);
}
console.log("koniec sesji");
await browser.close();
