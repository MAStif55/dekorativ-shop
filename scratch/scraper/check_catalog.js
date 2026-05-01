const fetch = require('node-fetch');

const urls = [
  'https://xn--80aeeeqk2aqt.xn--p1ai/shop',
  'https://xn--80aeeeqk2aqt.xn--p1ai/catalog',
  'https://xn--80aeeeqk2aqt.xn--p1ai/katalog'
];

(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.error(`${url}: Error ${e.message}`);
    }
  }
})();
