import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';
import fs from 'fs';
import path from 'path';

// WARNING: This is a temporary migration script.
// In a real production app, this should be protected by an auth guard or a secret token.

export async function GET(request: Request) {
    try {
        const filePath = path.join(process.cwd(), 'scratch', 'scraper', 'imported_products_v2.json');
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: false, error: 'Migration file not found.' }, { status: 404 });
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(data);

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ success: false, error: 'Migration file is empty or invalid.' }, { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection('products');

        // Insert products into the DB
        // Using insertMany, assuming no duplicates because UUIDs are freshly generated
        const result = await collection.insertMany(products);

        return NextResponse.json({
            success: true,
            message: `Successfully migrated ${result.insertedCount} products!`,
        });
    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
