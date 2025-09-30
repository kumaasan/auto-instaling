import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: false, // <- pokaże prawdziwe okno
  defaultViewport: null, // <- pełne okno zamiast małej ramki
});

const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto('https://developer.chrome.com/');

// Set screen size.
await page.setViewport({width: 1080, height: 1024});

// Open the search menu using the keyboard.
await page.keyboard.press('/');

// Type into search box using accessible input name.
await page.locator('::-p-aria(Search)').fill('automate beyond recorder');

// Wait and click on first result.
await page.locator('.devsite-result-item-link').click();

// Locate the full title with a unique string.
const textSelector = await page
  .locator('::-p-text(Customize and automate)')
  .waitHandle();
const fullTitle = await textSelector?.evaluate(el => el.textContent);

console.log('The title of this blog post is "%s".', fullTitle);

await browser.close();