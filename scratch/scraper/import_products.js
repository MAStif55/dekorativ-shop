const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const slugify = require('slugify');

const translit = (str) => {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 
    'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '', 
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return str.toLowerCase().split('').map(char => ru[char] || char).join('');
};

const TARGETS = [
  { url: 'https://xn--80aeeeqk2aqt.xn--p1ai/pechati-i-shtampy-dlya-surgucha-i-plastilina', category: 'seals' },
  { url: 'https://xn--80aeeeqk2aqt.xn--p1ai/flyazhki-termosy-s-gravirovkoy', category: 'flasks' },
  { url: 'https://xn--80aeeeqk2aqt.xn--p1ai/brasleti-s-gravirovkoy', category: 'bracelets' },
  { url: 'https://xn--80aeeeqk2aqt.xn--p1ai/adriesniki', category: 'pet-tags' },
  { url: 'https://xn--80aeeeqk2aqt.xn--p1ai/krutye-zazigalki', category: 'lighters' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  const finalDocs = [];
  const uploadsDir = 'D:\\Dekorativ\\public\\uploads\\imported';

  if (!fs.existsSync(uploadsDir)){
      fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const target of TARGETS) {
    console.log(`\n==========================================`);
    console.log(`Processing ${target.category}...`);
    
    const page = await browser.newPage();
    await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Scrolling down to load dynamic content...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1000));
    }
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const scrapedProducts = [];
    $('.js-w-productCard').each((i, el) => {
      const $el = $(el);
      const title = $el.find('.ul-w-productCard__title__content').text().trim() || $el.find('.js-w-productCard__picture__image').attr('alt');
      const description = $el.find('.ul-w-productCard__description').text().trim();
      const priceRaw = $el.find('.ul-w-productCard__price div[data-type="value"]').attr('data-raw');
      const price = priceRaw ? parseFloat(priceRaw) / 100 : 0;
      
      let imageUrl = $el.find('.js-w-productCard__picture__image').attr('src');
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = 'https://xn--80aeeeqk2aqt.xn--p1ai' + imageUrl;
      }
      
      if (title && imageUrl) {
        scrapedProducts.push({ title, description, price, imageUrl });
      }
    });

    console.log(`Found ${scrapedProducts.length} products in ${target.category}.`);

    for (const p of scrapedProducts) {
      const slug = slugify(translit(p.title), { lower: true, strict: true }) + '-' + crypto.randomBytes(2).toString('hex');
      const ext = path.extname(p.imageUrl.split('?')[0]) || '.jpg';
      const filename = `${slug}${ext}`;
      const destPath = path.join(uploadsDir, filename);

      console.log(`  -> Downloading ${filename}...`);
      try {
          const res = await fetch(p.imageUrl);
          const buffer = await res.buffer();
          fs.writeFileSync(destPath, buffer);
      } catch (e) {
          console.error('  -> Failed to download image:', e.message);
          continue;
      }

      const doc = {
        id: crypto.randomUUID(),
        slug: slug,
        title: { en: p.title, ru: p.title },
        description: { en: p.description, ru: p.description },
        basePrice: p.price,
        images: [{ 
           url: `/uploads/imported/${filename}`, 
           alt: { en: p.title, ru: p.title } 
        }],
        category: target.category,
        status: 'AVAILABLE',
        createdAt: Date.now()
      };
      finalDocs.push(doc);
    }
    
    await page.close();
  }

  await browser.close();

  fs.writeFileSync('imported_products_v2.json', JSON.stringify(finalDocs, null, 2));
  console.log(`\nSaved ${finalDocs.length} total products to imported_products_v2.json`);
})();
