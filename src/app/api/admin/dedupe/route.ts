import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export async function GET(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection('products');

        // Delete all products that have a string 'id' field.
        // The valid ones were already cleaned up and do not have an 'id' field.
        // The newly inserted duplicates have the 'id' field.
        const result = await collection.deleteMany({
            id: { $type: "string" }
        });

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} duplicate products!`,
        });
    } catch (error: any) {
        console.error('Dedupe failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
