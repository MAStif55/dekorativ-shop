import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    DocumentData,
} from 'firebase/firestore';
import { IOrderRepository } from '../interfaces';
import { Order } from '@/types/order';

const ordersCol = collection(db, 'orders');

function serializeDoc(id: string, data: DocumentData): Order {
    return {
        ...data,
        id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
        paidAt: data.paidAt?.toMillis ? data.paidAt.toMillis() : data.paidAt,
    } as Order;
}

export class FirebaseOrderRepository implements IOrderRepository {
    async getAll(): Promise<Order[]> {
        const q = query(ordersCol, orderBy('createdAt', 'desc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => serializeDoc(d.id, d.data()));
        } catch {
            const snapshot = await getDocs(ordersCol);
            const orders = snapshot.docs.map(d => serializeDoc(d.id, d.data()));
            return orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    }

    async getById(id: string): Promise<Order | null> {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return serializeDoc(docSnap.id, docSnap.data());
        }
        return null;
    }

    async create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string> {
        const docRef = await addDoc(ordersCol, {
            ...order,
            status: 'pending',
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Order>): Promise<void> {
        const docRef = doc(db, 'orders', id);
        await updateDoc(docRef, data as DocumentData);
    }
}
