
'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerRewards } from '@/hooks/useCustomerRewards';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, Gift, Edit2, MessageSquare, Save } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { LoyaltyModal } from '@/components/loyalty/LoyaltyModal';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerSelector } from './CustomerSelector';
import { EditItemModal } from './EditItemModal';
import { formatCurrency } from '@/lib/currency';
import { CartItem } from '@/types';

interface CartProps {
    onSaveOrder?: () => void;
}

export function Cart({ onSaveOrder }: CartProps) {
    const { items, updateQuantity, removeFromCart, updateItem, total, clearCart, addToCart, customerId, activeOrderId } = useCartStore();
    const { customers } = useCustomers();

    const selectedCustomer = customers.find(c => c.id === customerId);

    // IGV Calculation Logic (Peru: 18%)
    const totalWithTax = total();
    const igv = totalWithTax * (18 / 118);
    const subtotal = totalWithTax - igv;

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

    // Edit Item State
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);

    const { rewards, redeemReward } = useCustomerRewards(selectedCustomer?.id || null);
    const { data: products } = useProducts();

    const handleApplyReward = (reward: any) => {
        if (reward.loyalty_rules?.reward_type === 'product' && reward.loyalty_rules.reward_product_id) {
            const product = products?.find(p => p.id === reward.loyalty_rules.reward_product_id);
            if (product) {
                addToCart(product, undefined, [], 0); // Add with 0 price
                redeemReward.mutate(reward.id);
            } else {
                toast.error('Producto de recompensa no encontrado en catálogo');
            }
        } else {
            // Custom reward
            redeemReward.mutate(reward.id);
            toast.success('Entregar al cliente: ' + reward.reward_description);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l overflow-hidden">
            {/* Customer Selector */}
            <CustomerSelector />

            {/* Rewards Banner */}
            {rewards && rewards.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {rewards.length} Recompensa{rewards.length > 1 ? 's' : ''} disponible{rewards.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {rewards.map(reward => (
                            <div key={reward.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-800 shadow-sm">
                                <span className="text-xs font-medium">{reward.reward_description}</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-6 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300"
                                    onClick={() => handleApplyReward(reward)}
                                    disabled={redeemReward.isPending}
                                >
                                    Canjear
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Orden Actual</h2>
                <p className="text-sm text-gray-500">{items.length} productos</p>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.uniqueId} className="flex flex-col space-y-2 group">
                                <div
                                    className="flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-md transition-colors"
                                    onClick={() => setEditingItem(item)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{item.product.name}</p>
                                            {item.notes && (
                                                <MessageSquare className="h-3 w-3 text-blue-500" />
                                            )}
                                        </div>

                                        {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}

                                        {item.modifiers.length > 0 && (
                                            <p className="text-xs text-gray-500">
                                                {item.modifiers.map((m) => m.name).join(', ')}
                                            </p>
                                        )}

                                        {item.notes && (
                                            <p className="text-xs text-blue-600 italic mt-1">"{item.notes}"</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`font - bold ${item.manualPrice !== undefined ? 'text-blue-600' : ''} `}>
                                            {formatCurrency((item.manualPrice ?? (item.product.base_price + (item.variant?.price_adjustment || 0) + item.modifiers.reduce((a, b) => a + b.price, 0))) * item.quantity)}
                                        </p>
                                        {item.manualPrice !== undefined && (
                                            <p className="text-[10px] text-gray-400 line-through">
                                                {formatCurrency((item.product.base_price + (item.variant?.price_adjustment || 0) + item.modifiers.reduce((a, b) => a + b.price, 0)) * item.quantity)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.uniqueId, -1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.uniqueId, 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => setEditingItem(item)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeFromCart(item.uniqueId)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
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
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal (Base)</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>IGV (18%)</span>
                    <span>{formatCurrency(igv)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totalWithTax)}</span>
                </div>

                {selectedCustomer && (selectedCustomer.loyalty_points || 0) >= 10 ? (
                    <Button
                        variant="outline"
                        className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                        onClick={() => setIsLoyaltyOpen(true)} // We can reuse the modal or make a direct redeem action
                    >
                        <Gift className="mr-2 h-4 w-4" />
                        Canjear Bebida Gratis (Tienes {selectedCustomer.loyalty_points} pts)
                    </Button>
                ) : (
                    <div className="text-xs text-center text-gray-400 py-1">
                        {selectedCustomer
                            ? `Acumula ${(selectedCustomer.loyalty_points || 0)}/10 puntos para canje`
                            : 'Selecciona un cliente para sumar puntos'
                        }
                    </div >
                )}

                <div className="space-y-2">
                    {onSaveOrder && (
                        <Button
                            variant="outline"
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            onClick={onSaveOrder}
                            disabled={items.length === 0}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {activeOrderId ? 'Actualizar Cuenta' : 'Guardar / Estacionar Cuenta'}
                        </Button>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                        <Button variant="destructive" className="col-span-1" onClick={clearCart} disabled={items.length === 0}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="lg" className="col-span-3 bg-[#673de6] hover:bg-[#5a2fcc]" disabled={items.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                            Cobrar {formatCurrency(totalWithTax)}
                        </Button>
                    </div>
                </div>
            </div >

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                total={totalWithTax}
                subtotal={subtotal}
                tax={igv}
            />

            <LoyaltyModal
                isOpen={isLoyaltyOpen}
                onClose={() => setIsLoyaltyOpen(false)}
            />

            <EditItemModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                item={editingItem}
                onSave={updateItem}
            />
        </div >
    );
}
