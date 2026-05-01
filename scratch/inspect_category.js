fetch('https://xn--80aqahmcb0g.xn--p1ai/brelki-i-zhetony-s-gravirovkoy')
  .then(r => r.text())
  .then(html => {
     // Let's print out all h1, h2, h3 tags and img tags to see the content structure
     const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/g)].map(m => m[1]);
     const images = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
     const shopLinks = [...html.matchAll(/href=["'](\/shop\/product[^"']+)["']/g)].map(m => m[1]);
     const genericShopLinks = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]).filter(l => l.includes('product') || l.includes('item'));
     console.log({ h1s, imageCount: images.length, firstImages: images.slice(0, 5), shopLinks, genericShopLinks });
  });
