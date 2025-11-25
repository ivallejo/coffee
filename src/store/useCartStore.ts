import { create } from 'zustand';
import { CartItem, Product, Variant, Modifier } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
    items: CartItem[];
    customerId: string | null;
    activeOrderId: string | null;
    tableNumber: string | null;
    addToCart: (product: Product, variant?: Variant, modifiers?: Modifier[], manualPrice?: number) => void;
    removeFromCart: (uniqueId: string) => void;
    updateQuantity: (uniqueId: string, delta: number) => void;
    updateItem: (uniqueId: string, updates: Partial<CartItem>) => void;
    setCustomer: (customerId: string | null) => void;
    setActiveOrder: (orderId: string | null, tableNumber: string | null) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customerId: null,
    addToCart: (product, variant, modifiers = [], manualPrice) => {
        set((state) => {
            // Create a unique signature for the modifiers to compare
            const newModifiersIds = modifiers.map((m) => m.id).sort().join(',');

            const existingItemIndex = state.items.findIndex((item) => {
                const itemModifiersIds = item.modifiers.map((m) => m.id).sort().join(',');

                // If manualPrice is provided, treat as unique item (don't stack with normal price items)
                if (manualPrice !== undefined && item.manualPrice !== manualPrice) return false;

                return (
                    item.product.id === product.id &&
                    item.variant?.id === variant?.id &&
                    itemModifiersIds === newModifiersIds
                );
            });

            if (existingItemIndex > -1) {
                // Item exists, increment quantity
                const newItems = [...state.items];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + 1,
                };
                return { items: newItems };
            }

            // Item does not exist, add new
            const newItem: CartItem = {
                uniqueId: uuidv4(),
                product,
                variant,
                modifiers,
                quantity: 1,
                manualPrice
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
    updateItem: (uniqueId, updates) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.uniqueId === uniqueId ? { ...item, ...updates } : item
            ),
        }));
    },
    activeOrderId: null,
    tableNumber: null,
    setActiveOrder: (orderId, tableNumber) => set({ activeOrderId: orderId, tableNumber }),
    setCustomer: (customerId) => set({ customerId }),
    clearCart: () => set({ items: [], customerId: null, activeOrderId: null, tableNumber: null }),
    total: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
            // If manual price is set, use it. Otherwise calculate normal price.
            if (item.manualPrice !== undefined) {
                return sum + (item.manualPrice * item.quantity);
            }

            const base = item.product.base_price;
            const variantPrice = item.variant?.price_adjustment || 0;
            const modifiersPrice = item.modifiers.reduce((acc, mod) => acc + mod.price, 0);
            return sum + (base + variantPrice + modifiersPrice) * item.quantity;
        }, 0);
    },
}));
