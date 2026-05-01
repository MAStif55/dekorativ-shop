const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('page.html', 'utf8');
const $ = cheerio.load(html);

const firstCard = $('.js-w-productCard').first();
console.log('HTML of first card:', firstCard.html());
