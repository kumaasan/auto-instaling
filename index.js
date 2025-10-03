import puppeteer from 'puppeteer';

const daneLogowania = {
  login: "5pg186772",
  password: "iteri"
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
console.log("rozpoczecie sesji")
await page.waitForSelector('.btn.btn-instaling.btn-start-session', { visible: true });
await page.click('.btn.btn-instaling.btn-start-session');

//zacznij swoja codzienna sesje
console.log("zacznjij swoja codzienna sesje")
const test1 = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('*'))
    .map(e => e.className)
    .filter(c => c.includes('.btn'));
})
console.log(test1);
await page.waitForSelector('.btn.btn-instaling.btn-start-session', { visible: true });
await page.click('.btn.btn-instaling.btn-start-session')

const kontynuacjaSesji = await page.waitForSelector('btn.btn-instaling.btn-start-session', { visible: true });
if (kontynuacjaSesji){
  await page.click(kontynuacjaSesji);
}
console.log("po ifie")

//sprawdzanie slowka po poksku
const test = await page.evaluate(() => {
  const polskieSlowo = document.querySelector('.translation').innerText;
  return polskieSlowo;
})
console.log(test)

console.log("leci normalna sesja");

// await browser.close();