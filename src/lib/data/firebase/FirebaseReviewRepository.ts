import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    limit as firestoreLimit,
    onSnapshot,
    serverTimestamp,
    DocumentData,
} from 'firebase/firestore';
import { IReviewRepository } from '../interfaces';
import { Review } from '@/types/review';

const reviewsCol = collection(db, 'reviews');

function serializeDoc(id: string, data: DocumentData): Review {
    return {
        ...data,
        id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
    } as Review;
}

export class FirebaseReviewRepository implements IReviewRepository {
    async getLatest(count: number): Promise<Review[]> {
        const q = query(reviewsCol, orderBy('createdAt', 'desc'), firestoreLimit(count));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => serializeDoc(d.id, d.data()));
    }

    async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(reviewsCol, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Review>): Promise<void> {
        const docRef = doc(db, 'reviews', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'reviews', id));
    }

    subscribe(callback: (reviews: Review[]) => void): () => void {
        const q = query(reviewsCol, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviews = snapshot.docs.map(d => serializeDoc(d.id, d.data()));
            callback(reviews);
        }, (error) => {
            console.error('Review subscription error:', error);
        });
        return unsubscribe;
    }
}
