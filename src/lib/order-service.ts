// Types are defined locally below

const CLOUD_FUNCTION_URL = 'https://us-central1-somanatha-shop.cloudfunctions.net/createOrder';
// Re-export types that might be used elsewhere
export interface OrderItem {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    configuration?: Record<string, string>;
}

export interface Order {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    address: string;
    telegram?: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'completed' | 'cancelled' | 'archived';
    notes?: string;
    createdAt: number;
}

export interface CheckoutFormData {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    telegram?: string;
    notes?: string;
}

export interface CartItem {
    id: string;
    productId: string;
    productTitle: { en: string; ru: string };
    productImage: string;
    configuration?: Record<string, string>;
    price: number;
    quantity: number;
}

interface CreateOrderResult {
    success: boolean;
    orderId?: string;
    paymentUrl?: string;
    error?: string;
}

/**
 * Creates a new order via the API
 */
export async function createOrder(
    cartItems: CartItem[],
    customerInfo: CheckoutFormData,
    locale: string = 'ru'
): Promise<CreateOrderResult> {
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cartItems,
                customerInfo,
                locale,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit order');
        }

        return { success: true, orderId: result.orderId };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Deprecated or Server-only functions could be removed or marked
// For now, we removed the client-side Telegram logic entirely to prevent key leakage.
