import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    Timestamp,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';

/**
 * Generic Firestore CRUD Utilities
 * 
 * This module provides reusable functions for common Firestore operations.
 * Customize the collection names and types for your specific project.
 */

// ============================================================================
// COLLECTION REFERENCES - Customize these for your project
// ============================================================================

export const productsCol = collection(db, 'products');
export const ordersCol = collection(db, 'orders');
export const optionsCol = collection(db, 'options');
export const categoriesCol = collection(db, 'categories');
export const subcategoriesCol = collection(db, 'subcategories');
export const contentCol = collection(db, 'content');
export const settingsCol = collection(db, 'settings');
export const portfolioCategoriesCol = collection(db, 'portfolioCategories');
export const portfolioPhotosCol = collection(db, 'portfolioPhotos');
export const fontsCol = collection(db, 'fonts');

// ============================================================================
// GENERIC CRUD OPERATIONS
// ============================================================================

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T>(
    collectionRef: ReturnType<typeof collection>,
    ...constraints: QueryConstraint[]
): Promise<T[]> {
    const q = constraints.length > 0
        ? query(collectionRef, ...constraints)
        : collectionRef;

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Get a single document by ID
 */
export async function getDocumentById<T>(
    collectionName: string,
    id: string
): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
}

/**
 * Create a new document (auto-generated ID)
 */
export async function createDocument<T extends DocumentData>(
    collectionRef: ReturnType<typeof collection>,
    data: T
): Promise<string> {
    const dataWithTimestamp = {
        ...data,
        createdAt: Date.now()
    };
    const docRef = await addDoc(collectionRef, dataWithTimestamp);
    return docRef.id;
}

/**
 * Create or update a document with a specific ID
 */
export async function setDocument<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: T
): Promise<void> {
    await setDoc(doc(db, collectionName, id), data);
}

/**
 * Update specific fields in a document
 */
export async function updateDocument<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<T>
): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as DocumentData);
}

/**
 * Delete a document
 */
export async function deleteDocument(
    collectionName: string,
    id: string
): Promise<void> {
    await deleteDoc(doc(db, collectionName, id));
}

/**
 * Bulk update order for multiple documents
 */
export async function bulkUpdateOrder(
    collectionName: string,
    updates: { id: string; order: number }[]
): Promise<void> {
    const promises = updates.map(u => updateDocument(collectionName, u.id, { order: u.order } as any));
    await Promise.all(promises);
}

// ============================================================================
// PRODUCT-SPECIFIC HELPERS (Customize for your product type)
// ============================================================================

/**
 * Get all products, sorted by creation date (newest first)
 */
export async function getAllProducts<T>(): Promise<T[]> {
    const q = query(productsCol, orderBy('createdAt', 'desc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch {
        // Fallback if index doesn't exist
        const snapshot = await getDocs(productsCol);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        return products.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    }
}

export async function getNewestProducts<T>(count: number = 4): Promise<T[]> {
    const q = query(productsCol, orderBy('createdAt', 'desc'), firestoreLimit(count));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch {
        // Fallback if index doesn't exist
        const products = await getAllProducts<T>();
        return products.slice(0, count);
    }
}

/**
 * Get products by category
 */
export async function getProductsByCategory<T>(categorySlug: string): Promise<T[]> {
    const q = query(
        productsCol,
        where('category', '==', categorySlug),
        orderBy('createdAt', 'desc')
    );

    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch {
        // Silently fall back to manual filtering if index doesn't exist
        const all = await getAllProducts<T>();
        // @ts-ignore
        return all.filter(p => p.category === categorySlug);
    }
}

/**
 * Get a product by Slug
 */
export async function getProductBySlug<T>(slug: string): Promise<T | null> {
    const q = query(productsCol, where('slug', '==', slug), firestoreLimit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as T;
    }
    return null;
}

/**
 * Get a product by ID
 */
export async function getProductById<T>(id: string): Promise<T | null> {
    return getDocumentById<T>('products', id);
}

/**
 * Create a new product
 */
export async function createProduct<T extends DocumentData>(product: T): Promise<string> {
    // Auto-generate slug from Russian title if not provided
    const productWithSlug: any = { ...product };
    if (!productWithSlug.slug || productWithSlug.slug.trim() === '') {
        const ruTitle = productWithSlug.title?.ru || productWithSlug.title?.en || '';
        productWithSlug.slug = generateSlug(ruTitle);
    }
    return createDocument(productsCol, productWithSlug);
}

/**
 * Generate a URL-friendly slug from a string (supports Cyrillic)
 */
function generateSlug(text: string): string {
    // Cyrillic to Latin transliteration map
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
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Trim hyphens from ends
        + '-' + Date.now().toString(36).slice(-4); // Add unique suffix
}

/**
 * Update a product
 */
export async function updateProduct<T extends DocumentData>(
    id: string,
    data: Partial<T>
): Promise<void> {
    return updateDocument('products', id, data);
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
    return deleteDocument('products', id);
}

/**
 * Bulk update product base prices
 */
export async function bulkUpdateProductPrices(ids: string[], price: number): Promise<void> {
    const updates = ids.map(id => updateProduct(id, { basePrice: price }));
    await Promise.all(updates);
}

// ============================================================================
// ORDER HELPERS
// ============================================================================

/**
 * Create a new order
 */
export async function createOrder<T extends DocumentData>(
    order: Omit<T, 'id' | 'createdAt' | 'status'>
): Promise<string> {
    const docRef = await addDoc(ordersCol, {
        ...order,
        status: 'pending',
        createdAt: Date.now()
    });
    return docRef.id;
}

/**
 * Get all orders, sorted by creation date (newest first)
 */
export async function getAllOrders<T>(): Promise<T[]> {
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch {
        // Fallback
        const snapshot = await getDocs(ordersCol);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        return orders.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    }
}

/**
 * Update order status or other fields
 */
export async function updateOrder<T extends DocumentData>(
    id: string,
    data: Partial<T>
): Promise<void> {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, data as DocumentData);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wrap a promise with a timeout
 */
export const withTimeout = <T>(
    promise: Promise<T>,
    ms: number,
    opName: string
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation '${opName}' timed out after ${ms}ms`)), ms)
        )
    ]);
};

// ============================================================================
// MAIN CATEGORY (PAGE) HELPERS
// ============================================================================

export async function getCategories<T>(): Promise<T[]> {
    const q = query(categoriesCol, orderBy('order', 'asc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch {
        // Fallback if index doesn't exist
        const snapshot = await getDocs(categoriesCol);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        return docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }
}

export async function createMainCategory<T extends DocumentData>(data: T): Promise<string> {
    return createDocument(categoriesCol, data);
}

export async function updateMainCategory<T extends DocumentData>(id: string, data: Partial<T>): Promise<void> {
    return updateDocument('categories', id, data);
}

export async function deleteMainCategory(id: string): Promise<void> {
    return deleteDocument('categories', id);
}

// ============================================================================
// SUBCATEGORY HELPERS
// ============================================================================

export async function getSubcategories<T>(categorySlug: string): Promise<T[]> {
    const q = query(subcategoriesCol, where('parentCategory', '==', categorySlug));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    return docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
}

export async function createSubcategory<T extends DocumentData>(data: T): Promise<string> {
    return createDocument(subcategoriesCol, data);
}

export async function deleteSubcategory(id: string): Promise<void> {
    return deleteDocument('subcategories', id);
}


// ==========================================
// PORTFOLIO (Dynamic Gallery)
// ==========================================

import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';

// --- Categories ---

export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
    const q = query(portfolioCategoriesCol, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioCategory));
}

export async function getPortfolioCategoriesByPage(targetPageId: string): Promise<PortfolioCategory[]> {
    const q = query(
        portfolioCategoriesCol,
        where('targetPageId', '==', targetPageId),
        where('isActive', '==', true),
        orderBy('order', 'asc')
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioCategory));
    } catch {
        // Fallback for missing composite index
        const simpleQ = query(portfolioCategoriesCol, where('targetPageId', '==', targetPageId));
        const snapshot = await getDocs(simpleQ);
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioCategory));
        return cats
            .filter(cat => cat.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
}

export async function getPortfolioCategory(id: string): Promise<PortfolioCategory | null> {
    const docRef = doc(db, 'portfolioCategories', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as PortfolioCategory;
    return null;
}

export async function createPortfolioCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(portfolioCategoriesCol, {
        ...data,
        createdAt: Timestamp.now().toMillis()
    });
    return docRef.id;
}

export async function updatePortfolioCategory(id: string, data: Partial<PortfolioCategory>): Promise<void> {
    const docRef = doc(db, 'portfolioCategories', id);
    await updateDoc(docRef, data);
}

export async function deletePortfolioCategory(id: string): Promise<void> {
    const docRef = doc(db, 'portfolioCategories', id);
    await deleteDoc(docRef);
}

// --- Photos ---

export async function getPortfolioPhotosByCategory(categoryId: string): Promise<PortfolioPhoto[]> {
    const q = query(portfolioPhotosCol, where('categoryId', '==', categoryId), orderBy('order', 'asc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto));
    } catch {
        // Fallback if composite index is missing: just query by category and sort client-side
        const simpleQ = query(portfolioPhotosCol, where('categoryId', '==', categoryId));
        const snapshot = await getDocs(simpleQ);
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto));
        return photos.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
}

export async function getNewestPortfolioPhotos(limitCount: number = 4): Promise<PortfolioPhoto[]> {
    const q = query(portfolioPhotosCol, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto));
    } catch {
        // Fallback for missing index
        const fallbackQ = query(portfolioPhotosCol);
        const snapshot = await getDocs(fallbackQ);
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto));
        return photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limitCount);
    }
}

export async function getPortfolioPhotos(targetPageId?: string): Promise<PortfolioPhoto[]> {
    if (!targetPageId) {
        // Return all photos ordered by creation
        const q = query(portfolioPhotosCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto));
    }

    // 1. Find categories linked to targetPageId
    const catQuery = query(
        portfolioCategoriesCol,
        where('targetPageId', '==', targetPageId),
        where('isActive', '==', true)
    );
    const catSnapshot = await getDocs(catQuery);
    const categoryIds = catSnapshot.docs.map(doc => doc.id);

    if (categoryIds.length === 0) return [];

    // 2. Find photos for those categories
    const photos: PortfolioPhoto[] = [];

    // Batch processing to handle > 10 categories if needed
    for (let i = 0; i < categoryIds.length; i += 10) {
        const batchIds = categoryIds.slice(i, i + 10);
        const photoQuery = query(
            portfolioPhotosCol,
            where('categoryId', 'in', batchIds)
        );
        const pSnapshot = await getDocs(photoQuery);
        photos.push(...pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioPhoto)));
    }

    return photos.sort((a, b) => a.order - b.order); // Sort client side for simplicity
}

export async function createPortfolioPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(portfolioPhotosCol, {
        ...data,
        createdAt: Timestamp.now().toMillis()
    });
    return docRef.id;
}

export async function updatePortfolioPhoto(id: string, data: Partial<PortfolioPhoto>): Promise<void> {
    const docRef = doc(db, 'portfolioPhotos', id);
    await updateDoc(docRef, data);
}

export async function deletePortfolioPhoto(id: string): Promise<void> {
    const docRef = doc(db, 'portfolioPhotos', id);
    await deleteDoc(docRef);
}

// ==========================================
// FONTS MANAGEMENT
// ==========================================

export interface FontModel {
    id?: string;
    name: string;
    category: string;
    file: string;
    url: string;
    tags: string[];
    createdAt?: number;
    isVerified?: boolean;
}

export async function getFonts(): Promise<FontModel[]> {
    const q = query(fontsCol, orderBy('createdAt', 'desc'));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FontModel));
    } catch {
        // Fallback if index misses
        const snapshot = await getDocs(fontsCol);
        const fontDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FontModel));
        return fontDocs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
}

export async function createFont(data: Omit<FontModel, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(fontsCol, {
        ...data,
        createdAt: Timestamp.now().toMillis()
    });
    return docRef.id;
}

export async function updateFont(id: string, data: Partial<FontModel>): Promise<void> {
    const docRef = doc(db, 'fonts', id);
    await updateDoc(docRef, data);
}

export async function deleteFontDoc(id: string): Promise<void> {
    const docRef = doc(db, 'fonts', id);
    await deleteDoc(docRef);
}
