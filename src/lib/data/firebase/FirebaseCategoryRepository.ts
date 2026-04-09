import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    DocumentData,
} from 'firebase/firestore';
import { ICategoryRepository } from '../interfaces';
import { Category, SubCategory } from '@/types/category';

const categoriesCol = collection(db, 'categories');
const subcategoriesCol = collection(db, 'subcategories');

export class FirebaseCategoryRepository implements ICategoryRepository {
    async getAll(): Promise<Category[]> {
        const q = query(categoriesCol, orderBy('order', 'asc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        } catch {
            const snapshot = await getDocs(categoriesCol);
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
            return docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        }
    }

    async create(data: Omit<Category, 'id'>): Promise<string> {
        const docRef = await addDoc(categoriesCol, {
            ...data,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Category>): Promise<void> {
        const docRef = doc(db, 'categories', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'categories', id));
    }

    async getSubcategories(categorySlug: string): Promise<SubCategory[]> {
        const q = query(subcategoriesCol, where('parentCategory', '==', categorySlug));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubCategory));
        return docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }

    async createSubcategory(data: Omit<SubCategory, 'id'>): Promise<string> {
        const docRef = await addDoc(subcategoriesCol, {
            ...data,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async deleteSubcategory(id: string): Promise<void> {
        await deleteDoc(doc(db, 'subcategories', id));
    }

    async updateSubcategory(id: string, data: Partial<SubCategory>): Promise<void> {
        const docRef = doc(db, 'subcategories', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async bulkUpdateOrder(collectionName: string, updates: { id: string; order: number }[]): Promise<void> {
        const promises = updates.map(u => {
            const docRef = doc(db, collectionName, u.id);
            return updateDoc(docRef, { order: u.order });
        });
        await Promise.all(promises);
    }
}
