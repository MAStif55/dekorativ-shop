import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        const collection = db.collection('products');
        
        const products = await collection.find({
            $or: [
                { 'title.ru': { $regex: 'светящейся', $options: 'i' } },
                { 'title.en': { $regex: 'светящейся', $options: 'i' } }
            ]
        }).toArray();

        return NextResponse.json({
            count: products.length,
            products: products.map(p => ({
                id: p._id.toString(),
                title: p.title?.ru,
                status: p.status,
                basePrice: p.basePrice,
                labels: p.labels,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt
            }))
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
