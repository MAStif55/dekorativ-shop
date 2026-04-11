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
    return await ProductRepository.getNewest(count);
}

export async function getProductsByCategory(categorySlug: string) {
    return await ProductRepository.getByCategory(categorySlug);
}

export async function getProductBySlug(slug: string) {
    return await ProductRepository.getBySlug(slug);
}

export async function getAllProducts() {
    return await ProductRepository.getAll();
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

export async function getSubcategories(categorySlug: string) {
    return await CategoryRepository.getSubcategories(categorySlug);
}

// ==========================================
// PORTFOLIO (PUBLIC)
// ==========================================

export async function getPortfolioCategories() {
    return await PortfolioRepository.getCategories();
}

export async function getPortfolioCategoriesByPage(targetPageId: string) {
    return await PortfolioRepository.getCategoriesByPage(targetPageId);
}

export async function getPortfolioPhotosByCategory(categoryId: string) {
    return await PortfolioRepository.getPhotosByCategory(categoryId);
}

export async function getNewestPortfolioPhotos(count: number = 4) {
    return await PortfolioRepository.getNewestPhotos(count);
}

export async function getPortfolioPhotos(targetPageId?: string) {
    return await PortfolioRepository.getPhotos(targetPageId);
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

export async function getAllCategoryVariations() {
    return await VariationsRepository.getAllCategoryVariations();
}

// ==========================================
// SETTINGS (PUBLIC)
// ==========================================

export async function getSettings() {
    return await SettingsRepository.get();
}
