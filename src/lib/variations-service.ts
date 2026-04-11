'use server';

/**
 * COMPATIBILITY BRIDGE — SERVER ACTIONS
 * Delegates to VariationsRepository from the Data Access Layer.
 */

import { VariationsRepository } from '@/lib/data';
import { VariationGroup } from '@/types/product';

export async function getCategoryVariations(categorySlug: string): Promise<VariationGroup[]> {
    return VariationsRepository.getCategoryVariations(categorySlug);
}

export async function saveCategoryVariations(
    categorySlug: string,
    variations: VariationGroup[]
): Promise<void> {
    return VariationsRepository.saveCategoryVariations(categorySlug, variations);
}

export async function getAllCategoryVariations(): Promise<Record<string, VariationGroup[]>> {
    return VariationsRepository.getAllCategoryVariations();
}
