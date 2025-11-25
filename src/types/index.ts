export interface LoyaltyRule {
    id: string;
    name: string;
    description: string | null;
    condition_type: 'transaction_amount' | 'monthly_spend';
    threshold: number;
    reward_type: 'product' | 'custom';
    reward_product_id: string | null;
    reward_description: string;
    is_active: boolean;
    created_at: string;
}

export interface CustomerReward {
    id: string;
    customer_id: string;
    rule_id: string | null;
    status: 'pending' | 'redeemed' | 'expired';
    reward_description: string;
    created_at: string;
    redeemed_at: string | null;
    expires_at: string | null;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    sort_order?: number;
    created_at?: string;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    image_url?: string;
    base_price: number;
    cost_price?: number;
    stock: number;
    min_stock?: number;
    is_available: boolean;
    unit_of_measure?: string;
    product_type?: 'simple' | 'composite';
    variants?: Variant[];
    category?: {
        name: string;
    };
}

export interface Variant {
    id: string;
    product_id: string;
    name: string;
    price_adjustment: number;
}

export interface Modifier {
    id: string;
    name: string;
    price: number;
    category_id?: string;
}

export interface CartItem {
    uniqueId: string; // For React keys
    product: Product;
    variant?: Variant;
    modifiers: Modifier[];
    quantity: number;
    notes?: string;
    manualPrice?: number; // Override price
}

export interface Order {
    id: string;
    total_amount: number;
    subtotal: number;
    tax: number;
    payment_method: string; // Changed from enum to string for dynamic payment methods
    payment_data?: any; // JSON field for additional payment details
    amount_paid: number;
    change_returned: number;
    status: 'pending' | 'completed' | 'cancelled';
    document_type?: 'ticket' | 'boleta' | 'factura';
    document_series?: string;
    document_number?: string;
    created_at: string;
}
