import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { Product } from '@/types/product';
import { IProductRepository } from '../interfaces';

/**
 * Cyrillic-to-Latin transliteration for slug generation
 */
function generateSlug(text: string): string {
    const cyrillicToLatin: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return text
        .toLowerCase()
        .split('')
        .map(char => cyrillicToLatin[char] || char)
        .join('')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36).slice(-4);
}

export class MongoProductRepository implements IProductRepository {

    private toProduct(doc: any): Product {
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as Product;
    }

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    async getAll(): Promise<Product[]> {
        const db = await getDb();
        const docs = await db.collection('products')
            .find()
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        return docs.map(d => this.toProduct(d));
    }

    async getById(id: string): Promise<Product | null> {
        const db = await getDb();
        const doc = await db.collection('products').findOne(this.idFilter(id));
        return doc ? this.toProduct(doc) : null;
    }

    async getBySlug(slug: string): Promise<Product | null> {
        const db = await getDb();
        const doc = await db.collection('products').findOne({ slug });
        return doc ? this.toProduct(doc) : null;
    }

    async getByCategory(categorySlug: string): Promise<Product[]> {
        const db = await getDb();
        const docs = await db.collection('products')
            .find({ category: categorySlug })
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        return docs.map(d => this.toProduct(d));
    }

    async getNewest(count: number = 4): Promise<Product[]> {
        const db = await getDb();
        const docs = await db.collection('products')
            .find()
            .sort({ createdAt: -1 })
            .limit(count)
            .toArray();
        return docs.map(d => this.toProduct(d));
    }

    async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
        const db = await getDb();
        const productWithSlug: any = { ...product };
        if (!productWithSlug.slug || productWithSlug.slug.trim() === '') {
            const ruTitle = productWithSlug.title?.ru || productWithSlug.title?.en || '';
            productWithSlug.slug = generateSlug(ruTitle);
        }
        const { id, ...dataWithoutId } = productWithSlug;
        const result = await db.collection('products').insertOne({
            ...dataWithoutId,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async update(id: string, data: Partial<Product>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('products').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    async delete(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('products').deleteOne(this.idFilter(id));
    }

    async bulkUpdatePrices(ids: string[], price: number): Promise<void> {
        const updates = ids.map(id => this.update(id, { basePrice: price }));
        await Promise.all(updates);
    }

    async bulkUpdateOrder(updates: { id: string; order: number }[]): Promise<void> {
        const promises = updates.map(u => this.update(u.id, { order: u.order }));
        await Promise.all(promises);
    }
}
