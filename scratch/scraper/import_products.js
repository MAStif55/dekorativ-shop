const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
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

(async () => {
  const html = fs.readFileSync('page.html', 'utf8');
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

  console.log(`Found ${scrapedProducts.length} products to import.`);

  const uploadsDir = 'D:\\Dekorativ\\public\\uploads\\imported';
  const finalDocs = [];

  for (const p of scrapedProducts) {
    const slug = slugify(translit(p.title), { lower: true, strict: true }) + '-' + crypto.randomBytes(2).toString('hex');
    const ext = path.extname(p.imageUrl.split('?')[0]) || '.jpg';
    const filename = `${slug}${ext}`;
    const destPath = path.join(uploadsDir, filename);

    console.log(`Downloading ${p.imageUrl} to ${filename}...`);
    try {
        const res = await fetch(p.imageUrl);
        const buffer = await res.buffer();
        fs.writeFileSync(destPath, buffer);
    } catch (e) {
        console.error('Failed to download image:', e);
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
      category: 'brielki_zhietony_podvieski',
      status: 'AVAILABLE',
      createdAt: Date.now()
    };
    finalDocs.push(doc);
  }

  fs.writeFileSync('imported_products.json', JSON.stringify(finalDocs, null, 2));
  console.log('Saved imported_products.json');

  // Try DB
  const uri = 'mongodb://127.0.0.1:27017/dekorativ_data';
  const client = new MongoClient(uri);
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('dekorativ_data');
    const collection = db.collection('products');
    
    if (finalDocs.length > 0) {
        await collection.insertMany(finalDocs);
        console.log('Successfully inserted into MongoDB!');
    }
  } catch (e) {
    console.error('Error during MongoDB insert:', e.message);
  } finally {
    await client.close();
  }
})();
