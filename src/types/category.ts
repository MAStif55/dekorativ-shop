/**
 * Category Types and Configuration
 * 
 * Defines the product categories for Somanatha Shop (Vedic Store).
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
    slug: CategorySlug;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    icon?: string;
    // subcategories are now fetched dynamically
}

/**
 * Available Categories
 * 
 * These are the main product categories for the Vedic Store.
 */
export const CATEGORIES: Category[] = [
    {
        slug: 'keychains',
        title: {
            en: 'Keychains & Pendants',
            ru: 'Брелки, жетоны, подвески с гравировкой'
        },
        description: {
            en: 'Engraved keychains, tags, and pendants',
            ru: 'Брелки, жетоны, подвески с гравировкой'
        },
        icon: '🔑'
    },
    {
        slug: 'seals',
        title: {
            en: 'Wax & Clay Seals',
            ru: 'Печати и штампы для сургуча и пластилина'
        },
        description: {
            en: 'Custom seals and stamps for wax and clay',
            ru: 'Печати и штампы для сургуча и пластилина'
        },
        icon: '✉️'
    },
    {
        slug: 'flasks',
        title: {
            en: 'Flasks & Thermoses',
            ru: 'Фляжки, термосы с гравировкой'
        },
        description: {
            en: 'Engraved flasks and thermoses',
            ru: 'Фляжки, термосы с гравировкой'
        },
        icon: '🧊'
    },
    {
        slug: 'bracelets',
        title: {
            en: 'Engraved Bracelets',
            ru: 'Браслеты с гравировкой'
        },
        description: {
            en: 'Custom engraved bracelets',
            ru: 'Браслеты с гравировкой'
        },
        icon: '🔗'
    },
    {
        slug: 'pet-tags',
        title: {
            en: 'Pet ID Tags',
            ru: 'Адресники'
        },
        description: {
            en: 'Engraved pet ID tags',
            ru: 'Адресники для домашних животных'
        },
        icon: '🐾'
    },
    {
        slug: 'lighters',
        title: {
            en: 'Lighters',
            ru: 'Зажигалки'
        },
        description: {
            en: 'Engraved lighters',
            ru: 'Зажигалки с гравировкой'
        },
        icon: '🔥'
    },
    {
        slug: 'stationery',
        title: {
            en: 'Engraved Stationery',
            ru: 'Канцелярия с гравировкой'
        },
        description: {
            en: 'Engraved stationery and office supplies',
            ru: 'Канцелярия с гравировкой'
        },
        icon: '🖊️'
    }
];

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): Category | undefined {
    return CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Get all category slugs
 */
export function getAllCategorySlugs(): CategorySlug[] {
    return CATEGORIES.map(cat => cat.slug);
}
