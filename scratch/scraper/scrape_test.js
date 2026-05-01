const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to page...');
  await page.goto('https://xn--80aeeeqk2aqt.xn--p1ai/brielki_zhietony_podvieski', { waitUntil: 'networkidle2' });
  
  console.log('Scrolling down to load dynamic content...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
  }
  
  const content = await page.content();
  fs.writeFileSync('page.html', content);
  
  console.log('Saved page.html');
  await browser.close();
})();
