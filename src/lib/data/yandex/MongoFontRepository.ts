import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { FontModel } from '@/types/font';
import { IFontRepository } from '../interfaces';

export class MongoFontRepository implements IFontRepository {

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    async getAll(): Promise<FontModel[]> {
        const db = await getDb();
        const docs = await db.collection('fonts')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        return docs.map(d => {
            const { _id, ...rest } = d;
            return { id: _id.toString(), ...rest } as FontModel;
        });
    }

    async create(data: Omit<FontModel, 'id' | 'createdAt'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('fonts').insertOne({
            ...data,
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async update(id: string, data: Partial<FontModel>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('fonts').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }

    async delete(id: string): Promise<void> {
        const db = await getDb();
        await db.collection('fonts').deleteOne(this.idFilter(id));
    }
}
