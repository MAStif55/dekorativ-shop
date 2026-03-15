/**
 * Centralized cache configuration constants.
 */
export const CACHE_CONFIG = {
    /** How long (ms) to keep category data before re-fetching */
    CATEGORY_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;
