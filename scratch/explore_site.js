const fs = require('fs');

fetch('https://декоратив.рф/')
  .then(r => r.text())
  .then(html => {
     const links = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
     const uniqueLinks = [...new Set(links)];
     console.log(uniqueLinks.filter(l => !l.endsWith('.css') && !l.endsWith('.png') && !l.endsWith('.jpg') && !l.includes('.js')));
  });
