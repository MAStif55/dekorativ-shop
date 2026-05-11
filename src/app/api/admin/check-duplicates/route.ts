import { NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/data';

export async function GET() {
    try {
        const all = await ProductRepository.getAll();

        const byTitle: Record<string, { id: string; status: string; createdAt: number }[]> = {};

        for (const p of all) {
            const key = (p.title?.ru || '').trim().toLowerCase();
            if (!byTitle[key]) byTitle[key] = [];
            byTitle[key].push({
                id: p.id,
                status: p.status || 'AVAILABLE',
                createdAt: p.createdAt || 0,
            });
        }

        const duplicates = Object.entries(byTitle)
            .filter(([, items]) => items.length > 1)
            .map(([title, items]) => ({ title, count: items.length, ids: items.map(i => i.id) }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            total: all.length,
            uniqueTitles: Object.keys(byTitle).length,
            duplicateGroups: duplicates.length,
            duplicates,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
