import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export async function GET(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection('products');

        // Remove the string 'id' field from all documents so that the system
        // correctly falls back to using MongoDB's native '_id' (ObjectId)
        const result = await collection.updateMany(
            { id: { $exists: true } },
            { $unset: { id: "" } as any }
        );

        return NextResponse.json({
            success: true,
            message: `Successfully cleaned up ${result.modifiedCount} products!`,
        });
    } catch (error: any) {
        console.error('Cleanup failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
