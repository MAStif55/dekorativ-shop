import { getDb } from './mongo-client';
import { IVariationsRepository } from '../interfaces';
import { VariationGroup } from '@/types/product';

export class MongoVariationsRepository implements IVariationsRepository {

    async getCategoryVariations(categorySlug: string): Promise<VariationGroup[]> {
        try {
            const db = await getDb();
            const doc = await db.collection('categoryVariations').findOne({ _id: categorySlug as any });
            return doc?.variations || [];
        } catch (error) {
            console.error('Error getting category variations:', error);
            return [];
        }
    }

    async saveCategoryVariations(categorySlug: string, variations: VariationGroup[]): Promise<void> {
        try {
            const db = await getDb();
            await db.collection('categoryVariations').updateOne(
                { _id: categorySlug as any },
                { $set: { categorySlug, variations, updatedAt: Date.now() } },
                { upsert: true }
            );
        } catch (error) {
            console.error('Error saving category variations:', error);
            throw error;
        }
    }

    async getAllCategoryVariations(): Promise<Record<string, VariationGroup[]>> {
        const db = await getDb();
        const docs = await db.collection('categoryVariations').find().toArray();
        const result: Record<string, VariationGroup[]> = {};
        for (const doc of docs) {
            result[doc._id.toString()] = doc.variations || [];
        }
        return result;
    }
}
