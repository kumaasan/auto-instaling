import puppeteer from 'puppeteer';


const daneLogowania = {
  login: "5pg186772",
  password: "iteri"
}

const browser = await puppeteer.launch({
  headless: false, // <- pokaże prawdziwe okno
  defaultViewport: null, // <- pełne okno zamiast małej ramki
  args: ["--start-maximized"], // <- opcjonalnie: od razu zmaksymalizowane
});

const page = await browser.newPage();

await page.setViewport({width: 1080, height: 1024});

await page.goto('https://instaling.pl');

// cookies
const cookieBtn = page.locator('.fc-button-label').filter(el => el.innerText.includes('Consent'));

await cookieBtn.wait();

await new Promise(r => setTimeout(r, 500));

await cookieBtn.click();

//logowanie sie

await page.locator('.btn-login').click();

const loginInput = page.locator('.form-control').filter(input => input.id === 'log_email');

await loginInput.fill(daneLogowania.login);

await page.locator('#log_password').fill(daneLogowania.password);

await page.locator('.btn.btn-primary.w-100.mt-3.mb-3').click();

// rozpoczecie sesji

const dokonczSesje = page.locator('.btn.btn-instaling.btn-start-session');
if(!dokonczSesje){
  console.log("leci normalna sesja");
}else{
  dokonczSesje.click();
  // nie wiem dlaczego sie nie klika
  await page.locator('btn-instaling').filter(btn => btn.innerText.includes('Kontynuuj sesję')).click();


}




// await browser.close();