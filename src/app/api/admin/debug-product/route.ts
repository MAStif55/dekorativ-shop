import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { ObjectId } from 'mongodb';

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
                titleHex: Buffer.from(p.title?.ru || '').toString('hex'),
                status: p.status,
                basePrice: p.basePrice,
                labels: p.labels || [],
                createdAt: p.createdAt,
                updatedAt: p.updatedAt
            }))
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { id, action } = await req.json();
        const db = await getDb();
        const collection = db.collection('products');
        
        if (action === 'delete') {
            await collection.deleteOne({ _id: new ObjectId(id) });
            return NextResponse.json({ success: true, deleted: id });
        }
        
        return NextResponse.json({ error: 'invalid action' });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
