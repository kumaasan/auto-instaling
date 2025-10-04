import puppeteer from 'puppeteer';
import fs from 'fs';

let dictionary = [];

try {
  dictionary = JSON.parse(fs.readFileSync("dictionary.json", "utf8"));
  console.log(`Załadowano słownik: ${dictionary.length} slówek`);
} catch (err) {
  console.log("Brak słownika – zaczynamy nowy");
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

function getGermanWord(word){
  const wordPair = dictionary.find(item => item.polish === word);
  return wordPair ? wordPair.german : null;
}

async function clickButtonByText(page, selector, text) {
  const buttons = await page.$$(selector);

  for (const btn of buttons) {
    const btnText = await page.evaluate(el => el.innerText.trim(), btn);
    if (btnText === text) {
      console.log("Klikam przycisk:", btnText);

      try{
        // pewniejszy sposób
        await page.evaluate(el => el.click(), btn);
      }catch (err){
        console.error("Błąd przy klikaniu:", err);
      }
      return true;
    }
  }
  console.log("Nie znalazłem przycisku:", text);
  return false;
}


function saveToDictionary(){
  fs.writeFileSync("dictionary.json", JSON.stringify(dictionary, null, 2), "utf8");
  console.log("slownik zapisany");
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
await page.type('#log_email', daneLogowania.login);

await page.waitForSelector('#log_password');
await page.type('#log_password', daneLogowania.password);

await page.waitForSelector('.btn.btn-primary.w-100.mt-3.mb-3');
await page.click('.btn.btn-primary.w-100.mt-3.mb-3');

// rozpoczęcie sesji
console.log("rozpoczecie sesji");
await page.waitForSelector('.btn.btn-instaling.btn-start-session', { visible: true });
await page.click('.btn.btn-instaling.btn-start-session');

console.log("licze 5sek")
await sleep(5000);


const buttons = await page.$$('.btn.btn-instaling.btn-start-session');

for (const btn of buttons) {
  const text = await page.evaluate(el => el.innerText.trim(), btn);

  //tu jest do poprawienia ten if bo nie dziala przy 1 sesji
  if (text === "Kontynuuj sesję" || text === "Zacznij swoją codziennąsesję") {
    await btn.click();
    break;
  }
}
await sleep(3500)

while (true) {
  // czekaj na nowe polskie słowo
  let polishWord;
  try {
    await page.waitForSelector('.translation', { visible: true, timeout: 5000 });
    polishWord = await page.$eval('.translation', el => el.innerText.trim());
  } catch {
    console.log("Koniec sesji");
    break;
  }

  console.log("Słówko:", polishWord);

  let germanWord = getGermanWord(polishWord);

  await page.evaluate(() => { document.querySelector('#answer').value = ''; });

  if (!germanWord) {
    await page.type('#answer', "nie wiem");
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
    await page.waitForSelector('#word', { visible: true });
    const nieznaneNiemieckieSlowo = await page.$eval('#word', el => el.innerText.trim());
    console.log("Nowe:", polishWord, "=>", nieznaneNiemieckieSlowo);
    dictionary.push({ polish: polishWord, german: nieznaneNiemieckieSlowo });
    saveToDictionary();
  } else {
    await page.type('#answer', germanWord);
    await clickButtonByText(page, '.btn.btn-instaling.btn-start-session', "Sprawdź");
  }

  // przejście do następnego słowa
  await page.waitForSelector('#next_word', { visible: true });
  await page.click('#next_word');
  await sleep(1000);
}

// await browser.close();