import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { IVariationsRepository } from '../interfaces';
import { VariationGroup } from '@/types/product';

const COLLECTION_NAME = 'categoryVariations';

export class FirebaseVariationsRepository implements IVariationsRepository {
    async getCategoryVariations(categorySlug: string): Promise<VariationGroup[]> {
        try {
            const docRef = doc(db, COLLECTION_NAME, categorySlug);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.variations || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting category variations:', error);
            return [];
        }
    }

    async saveCategoryVariations(categorySlug: string, variations: VariationGroup[]): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, categorySlug);
            await setDoc(docRef, {
                categorySlug,
                variations,
                updatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Error saving category variations:', error);
            throw error;
        }
    }

    async getAllCategoryVariations(): Promise<Record<string, VariationGroup[]>> {
        const categories = ['yantras', 'kavacha'];
        const result: Record<string, VariationGroup[]> = {};
        for (const cat of categories) {
            result[cat] = await this.getCategoryVariations(cat);
        }
        return result;
    }
}
