import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Category } from '@/types/category';
import { CategoryRepository } from '@/lib/data';
import { CACHE_CONFIG } from '@/config/cache';

interface CategoryState {
    categories: Category[];
    lastFetched: number;
    isLoading: boolean;
    error: string | null;
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    fetchCategories: (force?: boolean) => Promise<void>;
}



export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categories: [],
            lastFetched: 0,
            isLoading: false,
            error: null,
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),

            fetchCategories: async (force = false) => {
                const { categories, lastFetched, isLoading } = get();
                const now = Date.now();

                // Return immediately if already loading
                if (isLoading) return;

                // Return immediately if valid cache exists and not forced
                if (!force && categories.length > 0 && (now - lastFetched < CACHE_CONFIG.CATEGORY_CACHE_DURATION)) {
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const fetchedCategories = await CategoryRepository.getAll();
                    set({
                        categories: fetchedCategories,
                        lastFetched: now,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error fetching categories:', error);
                    set({
                        error: 'Failed to fetch categories',
                        isLoading: false
                    });
                }
            }
        }),
        {
            name: 'category-storage',
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage to persist for the session
            partialize: (state) => ({
                categories: state.categories,
                lastFetched: state.lastFetched
            }), // Only persist data, not loading state
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
