import { create } from 'zustand';

/**
 * Product Cache Store
 * 
 * Caches product data to reduce Firestore reads.
 * Customize the Product type for your project.
 */

// ============================================================================
// TYPES - Replace with your actual product type
// ============================================================================

interface Product {
    id: string;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    basePrice: number;
    images: string[];
    [key: string]: unknown; // Allow additional fields
}

interface ProductCacheState {
    products: Product[];
    lastFetch: number | null;
    isLoading: boolean;
    setProducts: (products: Product[]) => void;
    setLoading: (loading: boolean) => void;
    getProduct: (id: string) => Product | undefined;
    isStale: (maxAgeMs?: number) => boolean;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

// Default cache max age: 5 minutes
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

export const useProductCache = create<ProductCacheState>((set, get) => ({
    products: [],
    lastFetch: null,
    isLoading: false,

    setProducts: (products) => {
        set({
            products,
            lastFetch: Date.now(),
            isLoading: false
        });
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },

    getProduct: (id) => {
        return get().products.find((p) => p.id === id);
    },

    isStale: (maxAgeMs = DEFAULT_MAX_AGE_MS) => {
        const { lastFetch } = get();
        if (!lastFetch) return true;
        return Date.now() - lastFetch > maxAgeMs;
    },
}));
