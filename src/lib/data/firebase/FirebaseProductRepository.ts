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
import { IProductRepository } from '../interfaces';
import { Product } from '@/types/product';

const productsCol = collection(db, 'products');

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

/**
 * Serialize Firestore document data — converts any Timestamp objects to epoch ms
 */
function serializeDoc(id: string, data: DocumentData): Product {
    return {
        ...data,
        id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
    } as Product;
}

export class FirebaseProductRepository implements IProductRepository {
    async getAll(): Promise<Product[]> {
        const q = query(productsCol, orderBy('createdAt', 'desc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => serializeDoc(d.id, d.data()));
        } catch {
            const snapshot = await getDocs(productsCol);
            const products = snapshot.docs.map(d => serializeDoc(d.id, d.data()));
            return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    }

    async getById(id: string): Promise<Product | null> {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return serializeDoc(docSnap.id, docSnap.data());
        }
        return null;
    }

    async getBySlug(slug: string): Promise<Product | null> {
        const q = query(productsCol, where('slug', '==', slug), firestoreLimit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const d = snapshot.docs[0];
            return serializeDoc(d.id, d.data());
        }
        return null;
    }

    async getByCategory(categorySlug: string): Promise<Product[]> {
        const q = query(productsCol, where('category', '==', categorySlug), orderBy('createdAt', 'desc'));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => serializeDoc(d.id, d.data()));
        } catch {
            const all = await this.getAll();
            return all.filter(p => p.category === categorySlug);
        }
    }

    async getNewest(count: number = 4): Promise<Product[]> {
        const q = query(productsCol, orderBy('createdAt', 'desc'), firestoreLimit(count));
        try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => serializeDoc(d.id, d.data()));
        } catch {
            const products = await this.getAll();
            return products.slice(0, count);
        }
    }

    async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
        const productWithSlug: any = { ...product };
        if (!productWithSlug.slug || productWithSlug.slug.trim() === '') {
            const ruTitle = productWithSlug.title?.ru || productWithSlug.title?.en || '';
            productWithSlug.slug = generateSlug(ruTitle);
        }
        const docRef = await addDoc(productsCol, {
            ...productWithSlug,
            createdAt: Date.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Product>): Promise<void> {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, data as DocumentData);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'products', id));
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
