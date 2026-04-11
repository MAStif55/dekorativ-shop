import { MongoClient, Db } from 'mongodb';

// ============================================================================
// YANDEX MONGODB CONNECTION SINGLETON
// Database: dekorativ_data (per architecture mapping in playbook)
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dekorativ_app:DekorativAppPass2026@127.0.0.1:27017/dekorativ_data';
const DB_NAME = process.env.MONGODB_DB_NAME || 'dekorativ_data';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (db) return db;

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    return db;
}

export async function closeDb(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
