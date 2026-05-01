fetch('https://xn--80aeeeqk2aqt.xn--p1ai/brielki_zhietony_podvieski')
  .then(r => r.text())
  .then(html => {
     const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/g)].map(m => m[1]);
     const titles = [...html.matchAll(/<div[^>]*class=["'][^"']*t-store__card__title[^"']*["'][^>]*>(.*?)<\/div>/g)].map(m => m[1]);
     const links = [...html.matchAll(/<a[^>]*href=["'](\/tproduct[^"']+)["'][^>]*>/g)].map(m => m[1]);
     console.log({ 
         h1s, 
         titleCount: titles.length, 
         firstTitles: titles.slice(0, 5), 
         linkCount: links.length, 
         firstLinks: links.slice(0, 5) 
     });
  });
