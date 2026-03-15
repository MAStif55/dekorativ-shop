/**
 * Centralized business logic constants for promotions & shipping.
 * Update values here — they propagate to the cart store, drawer, and checkout.
 */
export const PROMO_CONFIG = {
    /** Minimum subtotal (RUB) for free shipping */
    FREE_SHIPPING_THRESHOLD: 3000,
    /** Flat shipping cost (RUB) when threshold is not met */
    SHIPPING_COST: 350,
    /** Buy N items → get 1 free (the cheapest item) */
    GIFT_EVERY_N_ITEMS: 11,
} as const;
