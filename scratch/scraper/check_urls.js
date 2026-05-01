const fetch = require('node-fetch');

const urls = [
  'https://xn--80aeeeqk2aqt.xn--p1ai/pechati-i-shtampy-dlya-surgucha-i-plastilina',
  'https://xn--80aeeeqk2aqt.xn--p1ai/flyazhki-termosy-s-gravirovkoy',
  'https://xn--80aeeeqk2aqt.xn--p1ai/braslety-s-gravirovkoy',
  'https://xn--80aeeeqk2aqt.xn--p1ai/adresniki',
  'https://xn--80aeeeqk2aqt.xn--p1ai/zazhigalki',
  'https://xn--80aeeeqk2aqt.xn--p1ai/kantselyariya'
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
