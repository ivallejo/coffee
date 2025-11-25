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
import { Loader2, CreditCard, Banknote, Gift, Printer, Check } from 'lucide-react';
import { printReceipt } from '@/lib/printReceipt';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { formatCurrency } from '@/lib/currency';
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';
import { useLoyaltyEngine } from '@/hooks/useLoyaltyEngine';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDocumentSeries, getNextDocumentNumber } from '@/hooks/useDocumentSeries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subtotal: number;
    tax: number;
}

export function CheckoutModal({ isOpen, onClose, total, subtotal, tax }: CheckoutModalProps) {
    const { items, clearCart, customerId, activeOrderId } = useCartStore();
    const queryClient = useQueryClient();

    const { paymentMethods, isLoading: loadingMethods } = usePaymentMethods();
    const { documentSeries, getActiveSeries } = useDocumentSeries();
    const activeMethods = paymentMethods?.filter(pm => pm.is_active) || [];

    const [selectedMethodCode, setSelectedMethodCode] = useState('cash');
    const [documentType, setDocumentType] = useState<'ticket' | 'boleta' | 'factura'>('ticket');
    const [paymentDetails, setPaymentDetails] = useState<any>({});
    const [amountPaid, setAmountPaid] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const { settings } = useStoreSettings();
    const { profile } = useUserRole();
    const { processLoyalty } = useLoyaltyEngine();

    const currentMethod = activeMethods.find(m => m.code === selectedMethodCode);

    const change = selectedMethodCode === 'cash' ? Math.max(0, parseFloat(amountPaid || '0') - total) : 0;

    // Validation logic
    const isCashValid = selectedMethodCode === 'cash' ? parseFloat(amountPaid || '0') >= total : true;
    const isReferenceValid = currentMethod?.requires_reference ? !!paymentDetails.reference : true;
    const isDetailsValid = currentMethod?.requires_details ? !!paymentDetails.cardType : true;

    const canComplete = isCashValid && isReferenceValid && isDetailsValid;

    // Calculate smart quick cash amounts
    const getQuickAmounts = () => {
        const amounts = [total]; // Always include exact amount

        // Round up to nearest 5, 10, and 20
        const roundTo5 = Math.ceil(total / 5) * 5;
        const roundTo10 = Math.ceil(total / 10) * 10;
        const roundTo20 = Math.ceil(total / 20) * 20;

        // Add unique amounts
        if (roundTo5 > total) amounts.push(roundTo5);
        if (roundTo10 > total && roundTo10 !== roundTo5) amounts.push(roundTo10);
        if (roundTo20 > total && roundTo20 !== roundTo10) amounts.push(roundTo20);

        // If we don't have 4 amounts yet, add common bills
        const commonBills = [5, 10, 20, 50, 100];
        for (const bill of commonBills) {
            if (amounts.length >= 4) break;
            if (bill > total && !amounts.includes(bill)) {
                amounts.push(bill);
            }
        }

        return amounts.slice(0, 4); // Return max 4 amounts
    };

    const quickAmounts = getQuickAmounts();

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

            // Generate document number
            let documentInfo;
            try {
                documentInfo = await getNextDocumentNumber(documentType);
            } catch (error) {
                console.error('Error generating document number:', error);
                toast.error('Error al generar número de documento');
                return;
            }

            // 1. Create Order
            // 1. Create or Update Order
            let order;
            let orderError;

            const orderData = {
                shift_id: currentShift.id,
                cashier_id: user.id,
                customer_id: customerId || null,
                total_amount: total,
                subtotal: subtotal,
                tax: tax,
                payment_method: selectedMethodCode,
                payment_data: paymentDetails,
                amount_paid: selectedMethodCode === 'cash' ? parseFloat(amountPaid) : total,
                change_returned: change,
                status: 'completed',
                document_type: documentType,
                document_series: documentInfo.series,
                document_number: documentInfo.full_number
            };

            if (activeOrderId) {
                // Update existing pending order
                const { data, error } = await supabase
                    .from('orders')
                    .update(orderData)
                    .eq('id', activeOrderId)
                    .select()
                    .maybeSingle();

                if (error) {
                    orderError = error;
                } else if (data) {
                    order = data;
                    // Delete existing items to replace them with current cart
                    await supabase.from('order_items').delete().eq('order_id', activeOrderId);
                } else {
                    // Fallback: If order not found (e.g. deleted), create a new one
                    const { data: newOrder, error: newError } = await supabase
                        .from('orders')
                        .insert(orderData)
                        .select()
                        .single();
                    order = newOrder;
                    orderError = newError;
                }
            } else {
                // Create new order
                const { data, error } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select()
                    .single();
                order = data;
                orderError = error;
            }

            if (orderError) throw orderError;



            // 5. Process Loyalty Rules
            if (customerId) {
                await processLoyalty(customerId, total);
            }

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product.id,
                variant_id: item.variant?.id,
                product_name: item.product.name,
                variant_name: item.variant?.name,
                quantity: item.quantity,
                unit_price: item.manualPrice ?? (item.product.base_price + (item.variant?.price_adjustment || 0)), // Use manual price if set
                total_price: (item.manualPrice ?? (item.product.base_price + (item.variant?.price_adjustment || 0))) * item.quantity,
                modifiers: item.modifiers,
                notes: item.notes // Save notes
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Process Inventory (Recipes & Stock) - NOW AFTER ITEMS INSERTION
            const { error: inventoryError } = await supabase.rpc('process_inventory_for_order', {
                p_order_id: order.id
            });

            if (inventoryError) {
                console.error('Inventory processing error:', inventoryError);
                // Don't block the flow, but log it. Inventory can be reconciled later if needed.
            }

            toast.success(`¡Orden completada! Cambio: ${formatCurrency(change)}`);

            // Invalidate customers query to refresh loyalty points
            queryClient.invalidateQueries({ queryKey: ['customers'] });

            setPurchasedItems([...items]);
            setLastOrder(order);
            setSuccess(true);
            // clearCart and onClose will be called when closing the success screen

        } catch (error: any) {
            console.error('Error completing order:', error);
            toast.error('Error al completar la orden: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccess(false);
        setLastOrder(null);
        setPurchasedItems([]);
        setAmountPaid('');
        clearCart();
        onClose();
    };

    const handlePrint = () => {
        const cashierName = profile?.full_name || 'Staff';
        if (lastOrder && settings) {
            printReceipt(lastOrder, purchasedItems, settings, cashierName);
        } else if (lastOrder) {
            // Fallback if settings not loaded
            printReceipt(lastOrder, purchasedItems, { name: 'Anti Coffee' } as any, cashierName);
        }
    };

    if (success && lastOrder) {
        return (
            <Dialog open={isOpen} onOpenChange={handleCloseSuccess}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-green-600">¡Venta Exitosa!</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-6 py-6">
                        <div className="h-20 w-20 bg-[#673de6]/10 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-sm text-gray-500">Cambio a devolver</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(lastOrder.change_returned)}</p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <Button variant="outline" className="flex-1" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                            <Button className="flex-1 bg-[#673de6] hover:bg-[#5a2fcc]" onClick={handleCloseSuccess}>
                                Nueva Venta
                            </Button>
                        </div>

                        {/* Receipt Component removed - using iframe printing */}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Completar Venta</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <span className="font-medium">Total a Pagar</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(total)}</span>
                    </div>

                    {/* Document Type Selector */}
                    <div className="space-y-2">
                        <Label>Tipo de Comprobante</Label>
                        <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ticket">Ticket (Interno)</SelectItem>
                                <SelectItem value="boleta" disabled={!getActiveSeries('boleta')}>
                                    Boleta {!getActiveSeries('boleta') && '(No configurado)'}
                                </SelectItem>
                                <SelectItem value="factura" disabled={!getActiveSeries('factura')}>
                                    Factura {!getActiveSeries('factura') && '(No configurado)'}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {documentType !== 'ticket' && (
                            <p className="text-xs text-muted-foreground">
                                ⚠️ Boleta y Factura aún no tienen lógica de emisión implementada
                            </p>
                        )}
                    </div>

                    <Tabs defaultValue="cash" value={selectedMethodCode} className="w-full" onValueChange={setSelectedMethodCode}>
                        <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1 bg-muted rounded-lg">
                            {activeMethods.map(method => (
                                <TabsTrigger key={method.id} value={method.code} className="flex-1 capitalize min-w-[80px]">
                                    {method.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="cash" className="mt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Monto Recibido</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-9 text-lg"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(e.target.value)}
                                            autoFocus={selectedMethodCode === 'cash'}
                                        />
                                    </div>
                                </div>

                                {/* Quick Cash Buttons */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Efectivo Rápido</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {quickAmounts.map((amount, index) => (
                                            <Button
                                                key={index}
                                                type="button"
                                                variant="outline"
                                                className={`h-12 font-semibold hover:bg-gray-100 flex flex-col items-center justify-center ${index === 0 ? 'bg-[#673de6]/10 hover:bg-[#673de6]/20 border-[#673de6]' : ''
                                                    }`}
                                                onClick={() => setAmountPaid(amount.toFixed(2))}
                                            >
                                                <span className="text-sm">{formatCurrency(amount)}</span>
                                                {index === 0 && <span className="text-xs text-gray-500 font-normal">Exacto</span>}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                                    <span className="text-sm font-medium">Cambio a devolver:</span>
                                    <span className="text-xl font-bold text-blue-600">{formatCurrency(change)}</span>
                                </div>
                            </div>
                        </TabsContent>

                        {activeMethods.filter(m => m.code !== 'cash').map(method => (
                            <TabsContent key={method.id} value={method.code} className="mt-4">
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        {method.code.includes('card') ? <CreditCard className="h-10 w-10 text-gray-400 mb-2" /> : <div className="text-2xl mb-2">📱</div>}
                                        <p className="text-sm text-gray-500">Pago con {method.name}</p>
                                    </div>

                                    {method.requires_reference && (
                                        <div className="space-y-2">
                                            <Label>Número de Operación / Referencia</Label>
                                            <Input
                                                placeholder="Ej. 123456"
                                                value={paymentDetails.reference || ''}
                                                onChange={e => setPaymentDetails({ ...paymentDetails, reference: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {method.requires_details && method.code.includes('card') && (
                                        <div className="space-y-2">
                                            <Label>Tipo de Tarjeta</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={paymentDetails.cardType === 'credit' ? 'default' : 'outline'}
                                                    onClick={() => setPaymentDetails({ ...paymentDetails, cardType: 'credit' })}
                                                    className="flex-1"
                                                >
                                                    Crédito
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={paymentDetails.cardType === 'debit' ? 'default' : 'outline'}
                                                    onClick={() => setPaymentDetails({ ...paymentDetails, cardType: 'debit' })}
                                                    className="flex-1"
                                                >
                                                    Débito
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleCompleteOrder}
                        disabled={!canComplete || loading}
                        className="w-full sm:w-auto bg-[#673de6] hover:bg-[#5a2fcc]"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
