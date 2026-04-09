/**
 * Dependency Injection Hub
 * 
 * This is the SINGLE entry point for all data access in the application.
 * UI components import from here — never from Firebase directly.
 * 
 * To swap providers (e.g., Firebase → Supabase), replace the concrete
 * implementations below without touching any UI code.
 */

import { FirebaseProductRepository } from './firebase/FirebaseProductRepository';
import { FirebaseOrderRepository } from './firebase/FirebaseOrderRepository';
import { FirebaseCategoryRepository } from './firebase/FirebaseCategoryRepository';
import { FirebasePortfolioRepository } from './firebase/FirebasePortfolioRepository';
import { FirebaseReviewRepository } from './firebase/FirebaseReviewRepository';
import { FirebaseSettingsRepository } from './firebase/FirebaseSettingsRepository';
import { FirebaseFontRepository } from './firebase/FirebaseFontRepository';
import { FirebaseVariationsRepository } from './firebase/FirebaseVariationsRepository';
import { FirebaseStorageService } from './firebase/FirebaseStorageService';
import { FirebaseAuthService } from './firebase/FirebaseAuthService';

// Re-export interfaces for type-only imports
export type {
    IProductRepository,
    IOrderRepository,
    ICategoryRepository,
    IPortfolioRepository,
    IReviewRepository,
    ISettingsRepository,
    IFontRepository,
    IVariationsRepository,
    IStorageService,
    IAuthService,
    AuthUser,
    ICustomerService,
} from './interfaces';

// ── Concrete Instances ──────────────────────────────────────────

export const ProductRepository = new FirebaseProductRepository();
export const OrderRepository = new FirebaseOrderRepository();
export const CategoryRepository = new FirebaseCategoryRepository();
export const PortfolioRepository = new FirebasePortfolioRepository();
export const ReviewRepository = new FirebaseReviewRepository();
export const SettingsRepository = new FirebaseSettingsRepository();
export const FontRepository = new FirebaseFontRepository();
export const VariationsRepository = new FirebaseVariationsRepository();
export const StorageService = new FirebaseStorageService();
export const AuthService = new FirebaseAuthService();
