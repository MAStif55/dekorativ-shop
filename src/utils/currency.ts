/**
 * Currency Formatting Utilities
 */

/**
 * Format price in Russian Rubles
 */
export function formatPrice(price: number): string {
    return `${price.toLocaleString('ru-RU')} ₽`;
}

// Alias for compatibility with admin components
export const formatCurrency = formatPrice;

