const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('page.html', 'utf8');
const $ = cheerio.load(html);

// Try to guess the product selector
const candidates = [];
$('*').each((i, el) => {
  const className = $(el).attr('class') || '';
  if (className.includes('product') || className.includes('item') || className.includes('card')) {
    const text = $(el).text().trim();
    if (text.includes('₽') || text.includes('руб')) {
       // Avoid selecting the entire page or huge wrappers
       if ($(el).find('img').length > 0 && $(el).text().length < 500) {
          candidates.push(className);
       }
    }
  }
});

console.log('Possible product classes:', [...new Set(candidates)]);

// Let's also just dump the first few elements containing '₽' to see their structure
const priceElements = [];
$(':contains("₽")').each((i, el) => {
  if ($(el).children().length === 0) { // get the innermost elements
    priceElements.push({
       text: $(el).text(),
       class: $(el).attr('class'),
       parentClass: $(el).parent().attr('class'),
       grandparentClass: $(el).parent().parent().attr('class')
    });
  }
});

console.log('Price elements:', priceElements.slice(0, 5));
