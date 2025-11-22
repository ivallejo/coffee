'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, Gift } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { LoyaltyModal } from '@/components/loyalty/LoyaltyModal';
import { formatCurrency } from '@/lib/currency';

export function Cart() {
    const { items, updateQuantity, removeFromCart, total, clearCart } = useCartStore();
    const cartTotal = total();
    const tax = cartTotal * 0.1; // 10% tax example
    const finalTotal = cartTotal + tax;

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Orden Actual</h2>
                <p className="text-sm text-gray-500">{items.length} productos</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.uniqueId} className="flex flex-col space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                                    {item.modifiers.length > 0 && (
                                        <p className="text-xs text-gray-500">
                                            {item.modifiers.map((m) => m.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <p className="font-bold">
                                    {formatCurrency((item.product.base_price + (item.variant?.price_adjustment || 0) + item.modifiers.reduce((a, b) => a + b.price, 0)) * item.quantity)}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.uniqueId, -1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.uniqueId, 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeFromCart(item.uniqueId)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Separator />
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                            Carrito vacío
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Impuesto (10%)</span>
                    <span>{formatCurrency(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                </div>

                <Button
                    variant="outline"
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                    onClick={() => setIsLoyaltyOpen(true)}
                >
                    <Gift className="mr-2 h-4 w-4" />
                    Programa de Fidelidad
                </Button>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="destructive" onClick={clearCart} disabled={items.length === 0}>
                        Cancelar
                    </Button>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700" disabled={items.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                        Cobrar {formatCurrency(finalTotal)}
                    </Button>
                </div>
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                total={finalTotal}
                subtotal={cartTotal}
                tax={tax}
            />

            <LoyaltyModal
                isOpen={isLoyaltyOpen}
                onClose={() => setIsLoyaltyOpen(false)}
            />
        </div>
    );
}
