/**
 * Category Types and Configuration
 * 
 * Defines the product categories for Dekorativ Shop.
 */

export type CategorySlug = string;

export interface SubCategory {
    id?: string;
    slug: string;
    title: { en: string; ru: string };
    description?: { en: string; ru: string };
    order?: number;
    parentCategory?: CategorySlug;
}

export interface Category {
    id?: string;
    slug: CategorySlug;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    icon?: string;
    order?: number;
    // subcategories are now fetched dynamically
}


