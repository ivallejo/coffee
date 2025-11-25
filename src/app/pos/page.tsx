'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LayoutDashboard, ShoppingCart, LogOut, DollarSign, Lock } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCurrentShift } from '@/hooks/useShift';
import { OpenShiftModal } from '@/components/shift/OpenShiftModal';
import { CloseShiftModal } from '@/components/shift/CloseShiftModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { useUserRole } from '@/hooks/useUserRole';
import { TableSelectorModal, ActiveOrdersList } from '@/components/pos/TableManagement';
import { Armchair, Save } from 'lucide-react';

export default function POSPage() {
    const { isAdmin, profile, loading: roleLoading } = useUserRole();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const { items, activeOrderId, tableNumber, setActiveOrder, clearCart, addToCart, setCustomer } = useCartStore();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const router = useRouter();
    const { data: currentShift, isLoading: shiftLoading, refetch: refetchShift } = useCurrentShift();

    const handleLogout = async () => {
        if (currentShift) {
            toast.error('Debes cerrar la caja antes de salir');
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Error al cerrar sesión');
        } else {
            toast.success('Sesión cerrada');
            router.push('/login');
        }
    };

    const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
    const [isActiveOrdersOpen, setIsActiveOrdersOpen] = useState(false);

    const hasActiveShift = !!currentShift;

    const handleSaveOrder = async (tableInput?: string) => {
        if (items.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        const targetTable = tableInput || tableNumber;

        if (!activeOrderId && !targetTable) {
            setIsTableSelectorOpen(true);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !currentShift) return;

            const orderData = {
                shift_id: currentShift.id,
                cashier_id: user.id,
                customer_id: useCartStore.getState().customerId,
                total_amount: useCartStore.getState().total(),
                subtotal: useCartStore.getState().total(),
                tax: 0,
                status: 'pending',
                table_number: targetTable,
                payment_method: 'cash'
            };

            let savedOrderId = activeOrderId;

            if (activeOrderId) {
                const { error } = await supabase
                    .from('orders')
                    .update(orderData)
                    .eq('id', activeOrderId);
                if (error) throw error;
                toast.success('Orden actualizada');
            } else {
                const { data, error } = await supabase
                    .from('orders')
                    .insert(orderData)
                    .select()
                    .single();
                if (error) throw error;
                savedOrderId = data.id;
                toast.success(`Orden guardada para ${targetTable}`);
            }

            if (savedOrderId) {
                if (activeOrderId) {
                    await supabase.from('order_items').delete().eq('order_id', savedOrderId);
                }

                const orderItems = items.map(item => ({
                    order_id: savedOrderId,
                    product_id: item.product.id,
                    variant_id: item.variant?.id,
                    product_name: item.product.name,
                    variant_name: item.variant?.name,
                    quantity: item.quantity,
                    unit_price: item.manualPrice ?? (item.product.base_price + (item.variant?.price_adjustment || 0)),
                    total_price: (item.manualPrice ?? (item.product.base_price + (item.variant?.price_adjustment || 0))) * item.quantity,
                    modifiers: item.modifiers,
                    notes: item.notes
                }));

                const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
                if (itemsError) throw itemsError;
            }

            clearCart();
            setIsTableSelectorOpen(false);

        } catch (error: any) {
            console.error(error);
            toast.error('Error al guardar: ' + error.message);
        }
    };

    const handleRetrieveOrder = async (order: any) => {
        try {
            clearCart();
            const { data: items, error } = await supabase
                .from('order_items')
                .select(`*, product:products(*), variant:variants(*)`)
                .eq('order_id', order.id);

            if (error) throw error;

            items?.forEach((item: any) => {
                addToCart(
                    item.product,
                    item.variant,
                    item.modifiers || [],
                    item.unit_price
                );
                if (item.quantity > 1) {
                    useCartStore.getState().updateQuantity(useCartStore.getState().items[useCartStore.getState().items.length - 1].uniqueId, item.quantity - 1);
                }
            });

            setActiveOrder(order.id, order.table_number);
            setCustomer(order.customer_id);
            setIsActiveOrdersOpen(false);
            toast.success(`Orden de ${order.table_number} recuperada`);

        } catch (error: any) {
            toast.error('Error al recuperar: ' + error.message);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 bg-white dark:bg-gray-900 border-b">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">POS Cafetería</h1>
                            {!roleLoading && profile?.full_name && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-3 hidden md:inline-block border-l pl-3 border-gray-300 dark:border-gray-700">
                                    Hola, {profile.full_name}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {/* Shift Controls */}
                            {!shiftLoading && (
                                <>
                                    {hasActiveShift ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setIsCloseShiftModalOpen(true)}
                                        >
                                            <Lock className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Cerrar Caja</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => setIsOpenShiftModalOpen(true)}
                                            className="bg-[#673de6] hover:bg-[#5a2fcc]"
                                        >
                                            <DollarSign className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Aperturar Caja</span>
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Mobile Cart Button */}
                            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="md:hidden relative">
                                        <ShoppingCart className="h-4 w-4" />
                                        {itemCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {itemCount}
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-full sm:w-[400px] p-0">
                                    <Cart onSaveOrder={() => handleSaveOrder()} />
                                </SheetContent>
                            </Sheet>

                            {/* Admin Link - Only visible to admins */}
                            {!roleLoading && isAdmin && (
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Button>
                                </Link>
                            )}

                            {/* Shifts Link - Visible to everyone */}
                            {hasActiveShift && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsActiveOrdersOpen(true)}
                                    className="hidden sm:flex"
                                >
                                    <Armchair className="mr-2 h-4 w-4" />
                                    Mesas
                                </Button>
                            )}

                            <Link href="/shifts">
                                <Button variant="ghost" size="sm">
                                    <Lock className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Turnos</span>
                                </Button>
                            </Link>

                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Salir</span>
                            </Button>
                        </div>
                    </div>

                    {/* Shift Status Bar */}
                    {hasActiveShift && currentShift && (
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="default" className="bg-[#673de6]">
                                Caja Abierta
                            </Badge>
                            <span className="text-gray-600 dark:text-gray-400">
                                Inicio: {format(new Date(currentShift.start_time), 'HH:mm')} |
                                Efectivo Inicial: {formatCurrency(currentShift.start_cash)}
                            </span>
                        </div>
                    )}
                    {!hasActiveShift && !shiftLoading && (
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">
                                Caja Cerrada
                            </Badge>
                            <span className="text-gray-600 dark:text-gray-400">
                                Debes aperturar la caja para comenzar a vender
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-4 overflow-hidden">
                    {hasActiveShift ? (
                        <ProductGrid />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                                <Lock className="h-16 w-16 mx-auto text-gray-400" />
                                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                    Caja Cerrada
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Apertura la caja para comenzar a registrar ventas
                                </p>
                                <Button
                                    size="lg"
                                    onClick={() => setIsOpenShiftModalOpen(true)}
                                    className="bg-[#673de6] hover:bg-[#5a2fcc]"
                                >
                                    <DollarSign className="mr-2 h-5 w-5" />
                                    Aperturar Caja
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Cart Sidebar */}
            <div className="hidden md:block w-[400px] border-l bg-white dark:bg-gray-900 shadow-xl z-10 h-full">
                <Cart onSaveOrder={() => handleSaveOrder()} />
            </div>

            {/* Modals */}
            <OpenShiftModal
                isOpen={isOpenShiftModalOpen}
                onClose={() => setIsOpenShiftModalOpen(false)}
                onSuccess={refetchShift}
            />

            {currentShift && (
                <CloseShiftModal
                    isOpen={isCloseShiftModalOpen}
                    onClose={() => setIsCloseShiftModalOpen(false)}
                    shiftId={currentShift.id}
                    startCash={currentShift.start_cash}
                />
            )}

            <TableSelectorModal
                isOpen={isTableSelectorOpen}
                onClose={() => setIsTableSelectorOpen(false)}
                onConfirm={handleSaveOrder}
            />

            <ActiveOrdersList
                isOpen={isActiveOrdersOpen}
                onClose={() => setIsActiveOrdersOpen(false)}
                onSelectOrder={handleRetrieveOrder}
            />
        </div>
    );
}
