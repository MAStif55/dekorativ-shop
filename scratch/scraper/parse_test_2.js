const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('page.html', 'utf8');
const $ = cheerio.load(html);

const products = [];

$('.js-w-productCard').each((i, el) => {
  const $el = $(el);
  const title = $el.find('.product-card-title').text().trim() || $el.find('.title').text().trim() || $el.find('h3, h4').text().trim();
  const priceText = $el.find('.product-card-price').text().trim() || $el.find('.price').text().trim() || $el.find('[data-price]').text().trim();
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
  
  let imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || $el.find('img').attr('srcset');
  if (imageUrl && imageUrl.startsWith('//')) {
    imageUrl = 'https:' + imageUrl;
  }
  
  products.push({ title, priceText, price, imageUrl });
});

console.log('Found products:', products.length);
console.log('First 3 products:', products.slice(0, 3));
