import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { Category, SubCategory } from '@/types/category';
import { ICategoryRepository } from '../interfaces';

export class MongoCategoryRepository implements ICategoryRepository {

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    async getAll(): Promise<Category[]> {
        const db = await getDb();
        const docs = await db.collection('categories')
            .find()
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as Category;
        });
    }

    async create(data: Omit<Category, 'id'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('categories').insertOne({
            ...data,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async update(id: string, data: Partial<Category>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('categories').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    async delete(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('categories').deleteOne(this.idFilter(id));
    }

    // ── Subcategories ──────────────────────────────────────────

    async getSubcategories(categorySlug: string): Promise<SubCategory[]> {
        const db = await getDb();
        const docs = await db.collection('subcategories')
            .find({ parentCategory: categorySlug })
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as SubCategory;
        });
    }

    async createSubcategory(data: Omit<SubCategory, 'id'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('subcategories').insertOne({
            ...data,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async deleteSubcategory(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('subcategories').deleteOne(this.idFilter(id));
    }

    async updateSubcategory(id: string, data: Partial<SubCategory>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('subcategories').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    // ── Bulk Order ─────────────────────────────────────────────

    async bulkUpdateOrder(collectionName: string, updates: { id: string; order: number }[]): Promise<void> {
        const db = await getDb();
        const promises = updates.map(u => {
            return db.collection(collectionName).updateOne(
                this.idFilter(u.id),
                { $set: { order: u.order } }
            );
        });
        await Promise.all(promises);
    }
}
