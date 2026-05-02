import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export async function GET(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection('products');

        // Find duplicates by slug
        const pipeline = [
            {
                $group: {
                    _id: "$slug",
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicates = await collection.aggregate(pipeline).toArray();

        let totalDeleted = 0;
        for (const duplicate of duplicates) {
            // Keep the first document, delete the rest
            const idsToDelete = duplicate.docs.slice(1);
            if (idsToDelete.length > 0) {
                const deleteResult = await collection.deleteMany({ _id: { $in: idsToDelete } });
                totalDeleted += deleteResult.deletedCount || 0;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${totalDeleted} duplicate products!`,
        });
    } catch (error: any) {
        console.error('Dedupe failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
