const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB_NAME);
        const collection = db.collection('products');

        const all = await collection.find().toArray();
        console.log('Total:', all.length);

        const samples = all.slice(0, 10).map(doc => ({
            id: doc._id.toString(),
            type: typeof doc._id,
            constructor: doc._id.constructor.name,
            isObjectId: doc._id instanceof ObjectId
        }));

        console.log('Samples:', JSON.stringify(samples, null, 2));

        // Check a known UUID ID
        const uuidId = all.find(doc => doc._id.toString().includes('-'))?._id;
        if (uuidId) {
            console.log('UUID Sample:', {
                val: uuidId,
                type: typeof uuidId,
                constructor: uuidId.constructor.name,
                string: uuidId.toString()
            });
        }

    } finally {
        await client.close();
    }
}

run();
