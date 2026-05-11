import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/data';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    try {
        const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

        const all = await ProductRepository.getAll();

        // Group by normalized Russian title
        const byTitle: Record<string, typeof all> = {};
        for (const p of all) {
            const key = (p.title?.ru || '').trim().toLowerCase();
            if (!byTitle[key]) byTitle[key] = [];
            byTitle[key].push(p);
        }

        const toDelete: string[] = [];
        const report: { title: string; kept: string; deleted: string[] }[] = [];

        for (const [title, items] of Object.entries(byTitle)) {
            if (items.length <= 1 || !title) continue;

            // Keep the one with lowest createdAt (oldest = original), delete the rest
            const sorted = [...items].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const [keep, ...dupes] = sorted;

            report.push({
                title: title.substring(0, 60),
                kept: keep.id,
                deleted: dupes.map(d => d.id),
            });

            toDelete.push(...dupes.map(d => d.id));
        }

        const results: { id: string; success: boolean }[] = [];
        if (!dryRun && toDelete.length > 0) {
            const db = await getDb();
            const collection = db.collection('products');
            
            for (const id of toDelete) {
                const filter: any = ObjectId.isValid(id) && id.length === 24
                    ? { _id: new ObjectId(id) }
                    : { _id: id };
                
                const res = await collection.deleteOne(filter);
                results.push({ id, success: res.deletedCount > 0 });
            }
        }

        return NextResponse.json({
            dryRun,
            provider: process.env.NEXT_PUBLIC_DATA_PROVIDER || 'firebase',
            totalProducts: all.length,
            duplicateGroups: report.length,
            toDeleteCount: toDelete.length,
            actuallyDeleted: results.filter(r => r.success).length,
            failedToDelete: results.filter(r => !r.success).length,
            report,
            results: results.slice(0, 50), // Sample of results
        });
    } catch (e) {
        console.error('Cleanup error:', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
