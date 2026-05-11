import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/data';

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

        if (!dryRun && toDelete.length > 0) {
            await Promise.all(toDelete.map(id => ProductRepository.delete(id)));
        }

        return NextResponse.json({
            dryRun,
            totalProducts: all.length,
            duplicateGroups: report.length,
            toDeleteCount: toDelete.length,
            deleted: dryRun ? 0 : toDelete.length,
            report,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
