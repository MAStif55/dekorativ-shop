import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    DocumentData,
} from 'firebase/firestore';
import { IPortfolioRepository } from '../interfaces';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';

const portfolioCategoriesCol = collection(db, 'portfolioCategories');
const portfolioPhotosCol = collection(db, 'portfolioPhotos');

export class FirebasePortfolioRepository implements IPortfolioRepository {
    // ── Categories ──────────────────────────────────────────────

    async getCategories(): Promise<PortfolioCategory[]> {
        const q = query(portfolioCategoriesCol, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
        } as PortfolioCategory));
    }

    async getCategoriesByPage(targetPageId: string): Promise<PortfolioCategory[]> {
        const q = query(
            portfolioCategoriesCol,
            where('targetPageId', '==', targetPageId),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCategory));
        } catch {
            const simpleQ = query(portfolioCategoriesCol, where('targetPageId', '==', targetPageId));
            const snapshot = await getDocs(simpleQ);
            const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCategory));
            return cats.filter(cat => cat.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
        }
    }

    async getCategory(id: string): Promise<PortfolioCategory | null> {
        const docRef = doc(db, 'portfolioCategories', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as PortfolioCategory;
        return null;
    }

    async createCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(portfolioCategoriesCol, {
            ...data,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async updateCategory(id: string, data: Partial<PortfolioCategory>): Promise<void> {
        const docRef = doc(db, 'portfolioCategories', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async deleteCategory(id: string): Promise<void> {
        await deleteDoc(doc(db, 'portfolioCategories', id));
    }

    // ── Photos ──────────────────────────────────────────────────

    async getPhotosByCategory(categoryId: string): Promise<PortfolioPhoto[]> {
        const q = query(portfolioPhotosCol, where('categoryId', '==', categoryId), orderBy('order', 'asc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto));
        } catch {
            const simpleQ = query(portfolioPhotosCol, where('categoryId', '==', categoryId));
            const snapshot = await getDocs(simpleQ);
            const photos = snapshot.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto));
            return photos.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
    }

    async getNewestPhotos(count: number = 4): Promise<PortfolioPhoto[]> {
        const q = query(portfolioPhotosCol, orderBy('createdAt', 'desc'), firestoreLimit(count));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto));
        } catch {
            const fallbackQ = query(portfolioPhotosCol);
            const snapshot = await getDocs(fallbackQ);
            const photos = snapshot.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto));
            return photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, count);
        }
    }

    async getPhotos(targetPageId?: string): Promise<PortfolioPhoto[]> {
        if (!targetPageId) {
            const q = query(portfolioPhotosCol, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto));
        }

        const catQuery = query(
            portfolioCategoriesCol,
            where('targetPageId', '==', targetPageId),
            where('isActive', '==', true)
        );
        const catSnapshot = await getDocs(catQuery);
        const categoryIds = catSnapshot.docs.map(d => d.id);
        if (categoryIds.length === 0) return [];

        const photos: PortfolioPhoto[] = [];
        for (let i = 0; i < categoryIds.length; i += 10) {
            const batchIds = categoryIds.slice(i, i + 10);
            const photoQuery = query(portfolioPhotosCol, where('categoryId', 'in', batchIds));
            const pSnapshot = await getDocs(photoQuery);
            photos.push(...pSnapshot.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toMillis ? d.data().createdAt.toMillis() : (d.data().createdAt || Date.now()),
            } as PortfolioPhoto)));
        }

        return photos.sort((a, b) => a.order - b.order);
    }

    async createPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(portfolioPhotosCol, {
            ...data,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async updatePhoto(id: string, data: Partial<PortfolioPhoto>): Promise<void> {
        const docRef = doc(db, 'portfolioPhotos', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async deletePhoto(id: string): Promise<void> {
        await deleteDoc(doc(db, 'portfolioPhotos', id));
    }
}
