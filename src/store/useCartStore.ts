import { create } from 'zustand';
import { CartItem, Product, Variant, Modifier } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
    items: CartItem[];
    addToCart: (product: Product, variant?: Variant, modifiers?: Modifier[]) => void;
    removeFromCart: (uniqueId: string) => void;
    updateQuantity: (uniqueId: string, delta: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addToCart: (product, variant, modifiers = []) => {
        set((state) => {
            const newItem: CartItem = {
                uniqueId: uuidv4(),
                product,
                variant,
                modifiers,
                quantity: 1,
            };
            return { items: [...state.items, newItem] };
        });
    },
    removeFromCart: (uniqueId) => {
        set((state) => ({
            items: state.items.filter((item) => item.uniqueId !== uniqueId),
        }));
    },
    updateQuantity: (uniqueId, delta) => {
        set((state) => ({
            items: state.items.map((item) => {
                if (item.uniqueId === uniqueId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }),
        }));
    },
    clearCart: () => set({ items: [] }),
    total: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
            const base = item.product.base_price;
            const variantPrice = item.variant?.price_adjustment || 0;
            const modifiersPrice = item.modifiers.reduce((acc, mod) => acc + mod.price, 0);
            return sum + (base + variantPrice + modifiersPrice) * item.quantity;
        }, 0);
    },
}));
