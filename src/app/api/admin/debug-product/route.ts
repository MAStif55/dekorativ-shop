import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    try {
        const db = await getDb();
        const collection = db.collection('products');
        const allDocs = await collection.find().toArray();

        // Count how many duplicates there are
        const byTitle: Record<string, any[]> = {};
        for (const doc of allDocs) {
            const key = (doc.title?.ru || '').trim().toLowerCase();
            if (!byTitle[key]) byTitle[key] = [];
            byTitle[key].push(doc);
        }

        const toDeleteIds: any[] = [];
        let dupesCount = 0;

        for (const [title, docs] of Object.entries(byTitle)) {
            if (docs.length <= 1 || !title) continue;

            dupesCount++;
            
            // For the lighter, keep the OUT_OF_STOCK one if it exists.
            // For others, keep the oldest one.
            let keep = docs[0];
            let dupes = [];
            
            if (title.includes('светящейся')) {
                 const outOfStock = docs.find(d => d.status === 'OUT_OF_STOCK');
                 if (outOfStock) {
                     keep = outOfStock;
                     dupes = docs.filter(d => d._id !== outOfStock._id);
                 } else {
                     const sorted = [...docs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                     [keep, ...dupes] = sorted;
                 }
            } else {
                 const sorted = [...docs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                 [keep, ...dupes] = sorted;
            }

            toDeleteIds.push(...dupes.map(d => d._id));
        }

        return NextResponse.json({
            total: allDocs.length,
            dupesGroups: dupesCount,
            toDeleteCount: toDeleteIds.length
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { action } = await req.json();
        if (action === 'cleanup') {
            const db = await getDb();
            const collection = db.collection('products');
            const allDocs = await collection.find().toArray();

            const byTitle: Record<string, any[]> = {};
            for (const doc of allDocs) {
                const key = (doc.title?.ru || '').trim().toLowerCase();
                if (!byTitle[key]) byTitle[key] = [];
                byTitle[key].push(doc);
            }

            const toDeleteIds: any[] = [];
            for (const [title, docs] of Object.entries(byTitle)) {
                if (docs.length <= 1 || !title) continue;

                let keep = docs[0];
                let dupes = [];
                
                if (title.includes('светящейся')) {
                     const outOfStock = docs.find(d => d.status === 'OUT_OF_STOCK');
                     if (outOfStock) {
                         keep = outOfStock;
                         dupes = docs.filter(d => d._id !== outOfStock._id);
                     } else {
                         const sorted = [...docs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                         [keep, ...dupes] = sorted;
                     }
                } else {
                     // For all other duplicates, if one has OUT_OF_STOCK, keep it? No, generally keep oldest
                     // Actually, if a user edited one to add labels or change status, the updated one might be the oldest OR the newest.
                     // The user reported the out of stock one was deleted for the lighter. For others? The oldest is the safe bet, or the one with labels.
                     
                     // Keep the one that has labels, or is OUT_OF_STOCK, or is oldest
                     let best = docs[0];
                     for (const d of docs) {
                         const bestHasLabels = best.labels && best.labels.length > 0;
                         const dHasLabels = d.labels && d.labels.length > 0;
                         if (dHasLabels && !bestHasLabels) { best = d; continue; }
                         
                         if (d.status === 'OUT_OF_STOCK' && best.status !== 'OUT_OF_STOCK') { best = d; continue; }
                         
                         if (d.createdAt < best.createdAt) { best = d; continue; }
                     }
                     keep = best;
                     dupes = docs.filter(d => d._id !== best._id);
                }

                toDeleteIds.push(...dupes.map(d => d._id));
            }

            let deletedCount = 0;
            for (const id of toDeleteIds) {
                const res = await collection.deleteOne({ _id: id });
                if (res.deletedCount > 0) deletedCount++;
            }

            return NextResponse.json({ success: true, deletedCount });
        }
        return NextResponse.json({ error: 'invalid action' });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
