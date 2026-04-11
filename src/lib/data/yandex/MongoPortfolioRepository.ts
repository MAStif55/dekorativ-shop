import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { IPortfolioRepository } from '../interfaces';

export class MongoPortfolioRepository implements IPortfolioRepository {

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    // ── Categories ──────────────────────────────────────────────

    async getCategories(): Promise<PortfolioCategory[]> {
        const db = await getDb();
        const docs = await db.collection('portfolioCategories')
            .find()
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as PortfolioCategory;
        });
    }

    async getCategoriesByPage(targetPageId: string): Promise<PortfolioCategory[]> {
        const db = await getDb();
        const docs = await db.collection('portfolioCategories')
            .find({ targetPageId, isActive: true })
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as PortfolioCategory;
        });
    }

    async getCategory(id: string): Promise<PortfolioCategory | null> {
        const db = await getDb();
        const doc = await db.collection('portfolioCategories').findOne(this.idFilter(id));
        if (!doc) return null;
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as PortfolioCategory;
    }

    async createCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('portfolioCategories').insertOne({
            ...data,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async updateCategory(id: string, data: Partial<PortfolioCategory>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('portfolioCategories').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    async deleteCategory(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('portfolioCategories').deleteOne(this.idFilter(id));
    }

    // ── Photos ──────────────────────────────────────────────────

    async getPhotosByCategory(categoryId: string): Promise<PortfolioPhoto[]> {
        const db = await getDb();
        const docs = await db.collection('portfolioPhotos')
            .find({ categoryId })
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as PortfolioPhoto;
        });
    }

    async getNewestPhotos(count: number = 4): Promise<PortfolioPhoto[]> {
        const db = await getDb();
        const docs = await db.collection('portfolioPhotos')
            .find()
            .sort({ createdAt: -1 })
            .limit(count)
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as PortfolioPhoto;
        });
    }

    async getPhotos(targetPageId?: string): Promise<PortfolioPhoto[]> {
        const db = await getDb();

        if (!targetPageId) {
            const docs = await db.collection('portfolioPhotos')
                .find()
                .sort({ createdAt: -1 })
                .toArray();
            return docs.map(d => {
                const { _id, ...rest } = d;
                return { id: _id.toString(), ...rest } as PortfolioPhoto;
            });
        }

        // Get category IDs for this page
        const catDocs = await db.collection('portfolioCategories')
            .find({ targetPageId, isActive: true })
            .toArray();
        const categoryIds = catDocs.map(d => d._id.toString());
        if (categoryIds.length === 0) return [];

        const docs = await db.collection('portfolioPhotos')
            .find({ categoryId: { $in: categoryIds } })
            .sort({ order: 1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as PortfolioPhoto;
        });
    }

    async createPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('portfolioPhotos').insertOne({
            ...data,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async updatePhoto(id: string, data: Partial<PortfolioPhoto>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('portfolioPhotos').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    async deletePhoto(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('portfolioPhotos').deleteOne(this.idFilter(id));
    }
}
