/**
 * Centralized API Configuration
 *
 * All external API endpoints are referenced here.
 * Uses relative paths — works for both local dev and production.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const API = {
    CREATE_ORDER: `${API_BASE_URL}/api/checkout`,
    SUBMIT_FEEDBACK: `${API_BASE_URL}/api/feedback`,
} as const;
