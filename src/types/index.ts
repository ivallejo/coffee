export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    image_url?: string;
    base_price: number;
    variants?: Variant[];
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
}

export interface Order {
    id: string;
    total_amount: number;
    subtotal: number;
    tax: number;
    payment_method: 'cash' | 'card' | 'qr';
    amount_paid: number;
    change_returned: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
}
