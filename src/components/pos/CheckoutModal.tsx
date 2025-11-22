'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, CreditCard, Banknote, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subtotal: number;
    tax: number;
}

export function CheckoutModal({ isOpen, onClose, total, subtotal, tax }: CheckoutModalProps) {
    const { items, clearCart } = useCartStore();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountPaid || '0') - total) : 0;
    const canComplete = paymentMethod !== 'cash' || parseFloat(amountPaid || '0') >= total;

    const handleCompleteOrder = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Usuario no autenticado');
                return;
            }

            // Get current shift
            const { data: currentShift } = await supabase
                .from('shifts')
                .select('id')
                .eq('cashier_id', user.id)
                .is('end_time', null)
                .single();

            if (!currentShift) {
                toast.error('No hay un turno activo. Apertura la caja primero.');
                return;
            }

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    shift_id: currentShift.id,
                    cashier_id: user.id,
                    customer_phone: customerPhone || null,
                    total_amount: total,
                    subtotal: subtotal,
                    tax: tax,
                    payment_method: paymentMethod,
                    amount_paid: paymentMethod === 'cash' ? parseFloat(amountPaid) : total,
                    change_returned: change,
                    status: 'completed'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product.id,
                variant_id: item.variant?.id,
                product_name: item.product.name,
                variant_name: item.variant?.name,
                quantity: item.quantity,
                unit_price: item.product.base_price + (item.variant?.price_adjustment || 0),
                total_price: (item.product.base_price + (item.variant?.price_adjustment || 0)) * item.quantity,
                modifiers: item.modifiers // Storing JSONB
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            toast.success(`¡Orden completada! Cambio: ${formatCurrency(change)}`);
            clearCart();
            onClose();

        } catch (error: any) {
            toast.error('Error al completar la orden: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Pagar - Total: {formatCurrency(total)}</DialogTitle>
                </DialogHeader>

                {/* Loyalty Program */}
                <div className="space-y-2 pb-4 border-b">
                    <Label htmlFor="customer-phone" className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-600" />
                        Programa de Fidelidad (Opcional)
                    </Label>
                    <Input
                        id="customer-phone"
                        type="tel"
                        placeholder="Número de teléfono del cliente"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        Acumula 10 cafés y obtén 1 gratis
                    </p>
                </div>

                <Tabs defaultValue="cash" className="w-full" onValueChange={(v) => setPaymentMethod(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cash"><Banknote className="mr-2 h-4 w-4" /> Efectivo</TabsTrigger>
                        <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4" /> Tarjeta / QR</TabsTrigger>
                    </TabsList>

                    <div className="py-6 space-y-4">
                        <TabsContent value="cash" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount-paid">Monto Recibido</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    placeholder="0.00"
                                    className="text-lg"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-between text-lg font-bold p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span>Cambio:</span>
                                <span className={change < 0 ? 'text-red-500' : 'text-green-600'}>
                                    {formatCurrency(change)}
                                </span>
                            </div>
                        </TabsContent>

                        <TabsContent value="card">
                            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <CreditCard className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p>Solicite al cliente pasar la tarjeta o escanear el código QR.</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleCompleteOrder} disabled={!canComplete || loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Completar Orden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
