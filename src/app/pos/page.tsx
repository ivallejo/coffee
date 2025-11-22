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

export default function POSPage() {
    const { isAdmin, profile, loading: roleLoading } = useUserRole();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const items = useCartStore((state) => state.items);
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

    const hasActiveShift = !!currentShift;

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
                                            className="bg-green-600 hover:bg-green-700"
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
                                    <Cart />
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
                            <Badge variant="default" className="bg-green-600">
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
                                    className="bg-green-600 hover:bg-green-700"
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
            <div className="hidden md:block w-[400px] border-l bg-white dark:bg-gray-900 shadow-xl z-10">
                <Cart />
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
        </div>
    );
}
