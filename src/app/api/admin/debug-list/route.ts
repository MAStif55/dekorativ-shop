import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const db = await getDb();
        const docs = await db.collection('products').find({}, { projection: { slug: 1, title: 1 } }).toArray();

        // Count occurrences of each slug
        const counts: Record<string, number> = {};
        for (const doc of docs) {
            counts[doc.slug] = (counts[doc.slug] || 0) + 1;
        }

        const duplicates = Object.entries(counts).filter(([slug, count]) => count > 1);

        return NextResponse.json({
            success: true,
            totalDocs: docs.length,
            duplicatesCount: duplicates.length,
            duplicates
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
