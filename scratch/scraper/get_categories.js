const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://xn--80aeeeqk2aqt.xn--p1ai/', { waitUntil: 'networkidle2' });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('xn--80aeeeqk2aqt.xn--p1ai'))
      .map(a => ({ text: a.innerText.trim() || a.className, href: a.href }));
  });
  
  const uniqueUrls = new Set();
  links.forEach(c => {
    if (!uniqueUrls.has(c.href) && !c.href.includes('/product/')) {
        uniqueUrls.add(c.href);
        console.log(`- ${c.text.slice(0, 30)}: ${c.href}`);
    }
  });
  
  await browser.close();
})();
