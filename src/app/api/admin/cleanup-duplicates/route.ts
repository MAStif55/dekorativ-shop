import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/data';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    try {
        const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

        const db = await getDb();
        const collection = db.collection('products');
        const allDocs = await collection.find().toArray();

        // Group by normalized Russian title
        const byTitle: Record<string, any[]> = {};
        for (const doc of allDocs) {
            const key = (doc.title?.ru || '').trim().toLowerCase();
            if (!byTitle[key]) byTitle[key] = [];
            byTitle[key].push(doc);
        }

        const toDeleteIds: any[] = [];
        const report: any[] = [];

        for (const [title, docs] of Object.entries(byTitle)) {
            if (docs.length <= 1 || !title) continue;

            // Keep the oldest, delete the rest
            const sorted = [...docs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const [keep, ...dupes] = sorted;

            report.push({
                title: title.substring(0, 60),
                kept: keep._id.toString(),
                deleted: dupes.map(d => d._id.toString()),
            });

            toDeleteIds.push(...dupes.map(d => d._id));
        }

        let actuallyDeleted = 0;
        if (!dryRun && toDeleteIds.length > 0) {
            // Delete one by one to be safe and count
            for (const id of toDeleteIds) {
                const res = await collection.deleteOne({ _id: id });
                if (res.deletedCount > 0) actuallyDeleted++;
            }
        }

        return NextResponse.json({
            dryRun,
            totalProducts: allDocs.length,
            duplicateGroups: report.length,
            toDeleteCount: toDeleteIds.length,
            actuallyDeleted,
            report: report.slice(0, 20),
        });
    } catch (e) {
        console.error('Cleanup error:', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
