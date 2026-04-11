import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { Review } from '@/types/review';
import { IReviewRepository } from '../interfaces';

export class MongoReviewRepository implements IReviewRepository {

    private toReview(doc: any): Review {
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as Review;
    }

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    async getLatest(count: number): Promise<Review[]> {
        const db = await getDb();
        const docs = await db.collection('reviews')
            .find()
            .sort({ createdAt: -1 })
            .limit(count)
            .toArray();
        return docs.map(d => this.toReview(d));
    }

    async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('reviews').insertOne({
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async update(id: string, data: Partial<Review>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('reviews').updateOne(
            this.idFilter(id),
            { $set: { ...updateData, updatedAt: Date.now() } }
        );
    }

    async delete(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('reviews').deleteOne(this.idFilter(id));
    }

    /**
     * Subscribe to real-time updates.
     * MongoDB doesn't support Firestore-style onSnapshot natively.
     * Fallback: poll every 10 seconds. For production, consider Change Streams.
     */
    subscribe(callback: (reviews: Review[]) => void): () => void {
        let active = true;

        const poll = async () => {
            while (active) {
                try {
                    const db = await getDb();
                    const docs = await db.collection('reviews')
                        .find()
                        .sort({ createdAt: -1 })
                        .toArray();
                    if (active) {
                        callback(docs.map(d => this.toReview(d)));
                    }
                } catch (err) {
                    console.error('Review polling error:', err);
                }
                // Wait 10 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        };

        poll();

        return () => {
            active = false;
        };
    }
}
