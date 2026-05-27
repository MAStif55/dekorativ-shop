const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, '../public/uploads/gallery');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Попытка скачать файл через HTTPS
async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Handle redirects
                downloadImage(new URL(response.headers.location, url).toString(), dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(`Failed to download ${url}: ${response.statusCode}`);
            }
        }).on('error', reject);
    });
}

async function run() {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('dekorativ_data');
    
    // Очищаем старые данные (если нужно, можно убрать)
    await db.collection('portfolioCategories').deleteMany({ targetPageId: 'gallery' });
    // Но фото пока не удаляем все, так как у них нет targetPageId, 
    // но можно удалить все, чтобы избежать дублей при повторных запусках:
    await db.collection('portfolioCategories').find({}).toArray().then(cats => {
        if(cats.length === 0) {
            db.collection('portfolioPhotos').deleteMany({});
        }
    });

    console.log('Fetching old site...');
    // Используем punycode домен, чтобы избежать проблем с кириллицей
    const baseUrl = 'https://xn--80aeeeqk2aqt.xn--p1ai';
    const html = require('child_process').execSync(`curl -sL ${baseUrl}/primery-rabot`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    console.log(`Loaded HTML: ${html.length} chars`);

    // Разбиваем HTML по заголовкам
    const parts = html.split(/<h[1-3][^>]*class="[^"]*h3[^"]*"[^>]*>/i);
    console.log(`Found ${parts.length - 1} categories`);
    
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        
        // Извлекаем текст до закрывающего тега h1-h3
        const headerEnd = part.search(/<\/h[1-3]>/i);
        if (headerEnd === -1) continue;
        const titleHtml = part.substring(0, headerEnd);
        const title = titleHtml.replace(/<[^>]+>/g, '').trim();
        
        if (!title || title.toLowerCase() === 'контакты') continue;
        
        console.log(`\nProcessing category: ${title}`);
        
        const catId = new ObjectId().toString();
        
        // Транслитерация для слага
        const cyrillicToLatin = (text) => {
            const map = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
                'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
                'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
                'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
            };
            return text.toLowerCase().split('').map(char => map[char] || char).join('');
        };
        
        const slug = cyrillicToLatin(title).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        await db.collection('portfolioCategories').insertOne({
            _id: catId,
            id: catId,
            name: { ru: title, en: title },
            slug: slug,
            targetPageId: 'gallery',
            isActive: true,
            order: i,
            createdAt: Date.now()
        });
        
        const linkMatches = part.matchAll(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*js-gallery2-link[^"]*"[^>]*>([\s\S]*?)<\/a>/gi);
        let order = 0;
        
        for (const linkMatch of linkMatches) {
            order++;
            let imgUrlFull = linkMatch[1];
            // Fix double slashes or missing domain
            if (imgUrlFull.startsWith('/')) imgUrlFull = baseUrl + imgUrlFull;
            
            const innerHtml = linkMatch[2];
            const altMatch = innerHtml.match(/alt="([^"]*)"/i);
            const altText = altMatch ? altMatch[1] : '';
            const titleAttrMatch = innerHtml.match(/title="([^"]*)"/i);
            const imgTitle = titleAttrMatch ? titleAttrMatch[1] : '';
            
            const filename = path.basename(new URL(imgUrlFull).pathname);
            const localUrl = `/uploads/gallery/${filename}`;
            const dest = path.join(UPLOADS_DIR, filename);
            
            try {
                if (!fs.existsSync(dest)) {
                    console.log(`Downloading ${filename}...`);
                    await downloadImage(imgUrlFull, dest);
                } else {
                    console.log(`File ${filename} already exists, skipping download.`);
                }
                
                const photoId = new ObjectId().toString();
                await db.collection('portfolioPhotos').insertOne({
                    _id: photoId,
                    id: photoId,
                    categoryId: catId,
                    imageUrl: localUrl,
                    order: order,
                    createdAt: Date.now(),
                    seo: {
                        title: imgTitle || title,
                        altText: { ru: altText || title, en: altText || title },
                        description: { ru: '', en: '' },
                        keywords: []
                    }
                });
            } catch (err) {
                console.error(`Error downloading ${imgUrlFull}:`, err);
            }
        }
        
        console.log(`Saved ${order} photos for "${title}"`);
    }
    
    await client.close();
    console.log('\nMigration complete!');
}

run().catch(console.error);
