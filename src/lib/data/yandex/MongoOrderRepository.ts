import { ObjectId } from 'mongodb';
import { getDb } from './mongo-client';
import { Order } from '@/types/order';
import { IOrderRepository } from '../interfaces';

export class MongoOrderRepository implements IOrderRepository {

    private toOrder(doc: any): Order {
        const { _id, ...rest } = doc;
        return { id: _id.toString(), ...rest } as Order;
    }

    private idFilter(id: string) {
        return ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id as any };
    }

    async getAll(): Promise<Order[]> {
        const db = await getDb();
        const docs = await db.collection('orders')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        return docs.map(d => this.toOrder(d));
    }

    async getById(id: string): Promise<Order | null> {
        const db = await getDb();
        const doc = await db.collection('orders').findOne(this.idFilter(id));
        return doc ? this.toOrder(doc) : null;
    }

    async create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> {
        const db = await getDb();
        const result = await db.collection('orders').insertOne({
            ...order,
            status: 'pending',
            createdAt: Date.now(),
        });
        return result.insertedId.toString();
    }

    async update(id: string, data: Partial<Order>): Promise<void> {
        const db = await getDb();
        const { id: _, ...updateData } = data as any;
        await db.collection('orders').updateOne(
            this.idFilter(id),
            { $set: updateData }
        );
    }
}
