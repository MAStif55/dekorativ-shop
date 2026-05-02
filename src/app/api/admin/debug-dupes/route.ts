import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export async function GET(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection('products');

        // Find products with the same slug
        const pipeline = [
            {
                $group: {
                    _id: "$slug",
                    count: { $sum: 1 },
                    docs: { $push: "$$ROOT" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            },
            {
                $limit: 2 // Just get a couple of examples
            }
        ];

        const duplicates = await collection.aggregate(pipeline).toArray();

        return NextResponse.json({
            success: true,
            duplicates
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
