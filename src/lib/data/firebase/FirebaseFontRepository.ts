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
    DocumentData,
} from 'firebase/firestore';
import { IFontRepository } from '../interfaces';
import { FontModel } from '@/types/font';

const fontsCol = collection(db, 'fonts');

export class FirebaseFontRepository implements IFontRepository {
    async getAll(): Promise<FontModel[]> {
        const q = query(fontsCol, orderBy('createdAt', 'desc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as FontModel));
        } catch {
            const snapshot = await getDocs(fontsCol);
            const fontDocs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as FontModel));
            return fontDocs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    }

    async create(data: Omit<FontModel, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(fontsCol, {
            ...data,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<FontModel>): Promise<void> {
        const docRef = doc(db, 'fonts', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'fonts', id));
    }
}
