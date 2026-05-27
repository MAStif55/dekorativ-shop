'use server';

import {
    ProductRepository,
    CategoryRepository,
    PortfolioRepository,
    ReviewRepository,
    FontRepository,
    VariationsRepository,
    SettingsRepository,
} from '@/lib/data';
import { Product } from '@/types/product';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';

// ==========================================
// PRODUCTS (PUBLIC)
// ==========================================

export async function getNewestProducts(count: number = 4) {
    // Use getAll to avoid issues with identical createdAt timestamps from migration
    // (getNewest sorts by createdAt DESC with a hard limit, so migration duplicates
    // with the same timestamp dominate the results)
    const all = await ProductRepository.getAll();

    const uniqueProducts: Product[] = [];
    const seenTitles = new Set<string>();

    for (const p of all) {
        // Only show AVAILABLE products in the Popular section
        if (p.status !== 'AVAILABLE') continue;

        const titleRu = p.title?.ru?.trim().toLowerCase();
        // Use ID as fallback key when title is empty, to avoid false deduplication
        const titleKey = titleRu ? titleRu : `__id__${p.id}`;

        if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            uniqueProducts.push(p);
        }

        if (uniqueProducts.length >= count) break;
    }

    return uniqueProducts;
}



export async function getProductBySlug(slug: string) {
    return await ProductRepository.getBySlug(slug);
}

export async function getAllProducts() {
    const products = await ProductRepository.getAll();
    return products.filter(p => p.status !== 'HIDDEN');
}

export async function getProductById(id: string) {
    return await ProductRepository.getById(id);
}

// ==========================================
// CATEGORIES (PUBLIC)
// ==========================================

export async function getAllCategories() {
    return await CategoryRepository.getAll();
}



// ==========================================
// PORTFOLIO (PUBLIC)
// ==========================================



export async function getPortfolioCategoriesByPage(targetPageId: string) {
    return await PortfolioRepository.getCategoriesByPage(targetPageId);
}

export async function getPortfolioCategories() {
    return await PortfolioRepository.getCategories();
}

export async function getPortfolioCategory(id: string) {
    return await PortfolioRepository.getCategory(id);
}

export async function getPortfolioPhotosByCategory(categoryId: string) {
    return await PortfolioRepository.getPhotosByCategory(categoryId);
}

export async function getNewestPortfolioPhotos(count: number = 4) {
    return await PortfolioRepository.getNewestPhotos(count);
}



// ==========================================
// REVIEWS (PUBLIC)
// ==========================================

export async function getLatestReviews(count: number = 10) {
    return await ReviewRepository.getLatest(count);
}

// ==========================================
// FONTS (PUBLIC)
// ==========================================

export async function getAllFonts() {
    return await FontRepository.getAll();
}

// ==========================================
// VARIATIONS (PUBLIC)
// ==========================================

export async function getCategoryVariations(categorySlug: string) {
    return await VariationsRepository.getCategoryVariations(categorySlug);
}



// ==========================================
// SETTINGS (PUBLIC)
// ==========================================


