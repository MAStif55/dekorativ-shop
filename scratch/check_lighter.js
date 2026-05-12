const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection('products');

        const products = await collection.find({
            $or: [
                { 'title.ru': { $regex: 'светящейся', $options: 'i' } },
                { 'title.en': { $regex: 'светящейся', $options: 'i' } }
            ]
        }).toArray();

        console.log(`Found ${products.length} products`);
        products.forEach(p => {
            console.log(JSON.stringify({
                id: p._id.toString(),
                title: p.title?.ru,
                status: p.status,
                basePrice: p.basePrice,
                labels: p.labels,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt
            }, null, 2));
        });
    } finally {
        await client.close();
    }
}

run().catch(console.error);
