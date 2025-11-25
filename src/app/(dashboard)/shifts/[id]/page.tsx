'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, DollarSign, CreditCard, Smartphone, ShoppingBag, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';
import { printReceipt } from '@/lib/printReceipt';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface ShiftStats {
    totalOrders: number;
    totalSales: number;
    cashSales: number;
    cardSales: number;
    qrSales: number;
    cashOrders: number;
    cardOrders: number;
    qrOrders: number;
    averageTicket: number;
    orders: any[];
}

interface ShiftData {
    id: string;
    start_time: string;
    end_time: string | null;
    start_cash: number;
    end_cash: number | null;
    expected_cash: number | null;
    notes: string | null;
}

// Order Detail Card Component
function OrderDetailCard({ order }: { order: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const { settings } = useStoreSettings();
    const { profile } = useUserRole();

    const handleReprint = (e: React.MouseEvent) => {
        e.stopPropagation();

        const items = order.order_items.map((item: any) => ({
            uniqueId: item.id,
            product: {
                id: item.product_id,
                name: item.products?.name || 'Producto',
                base_price: 0,
                category_id: '',
                is_available: true
            },
            quantity: item.quantity,
            variant: item.variant_name ? { name: item.variant_name, price_adjustment: 0 } : undefined,
            modifiers: item.modifiers || [],
            manualPrice: item.unit_price
        }));

        printReceipt(order, items, settings || { name: 'Anti Coffee' } as any, profile?.full_name);
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'cash':
                return <DollarSign className="h-4 w-4" />;
            case 'card':
                return <CreditCard className="h-4 w-4" />;
            case 'qr':
                return <Smartphone className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash':
                return 'Efectivo';
            case 'card':
                return 'Tarjeta';
            case 'qr':
                return 'QR';
            default:
                return method;
        }
    };

    const itemCount = order.order_items?.length || 0;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="text-center min-w-[80px]">
                                <p className="text-xs text-gray-500">Hora</p>
                                <p className="font-semibold">
                                    {format(new Date(order.created_at), 'HH:mm:ss', { locale: es })}
                                </p>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(order.payment_method)}
                                <div>
                                    <p className="text-xs text-gray-500">Método</p>
                                    <p className="font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-10 hidden sm:block" />
                            <div className="hidden sm:block">
                                <p className="text-xs text-gray-500">Productos</p>
                                <p className="font-medium">{itemCount} items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(order.total_amount)}
                                </p>
                            </div>

                            <Button variant="outline" size="sm" onClick={handleReprint} title="Reimprimir Ticket">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                                {isOpen ? (
                                    <ChevronUp className="h-5 w-5" />
                                ) : (
                                    <ChevronDown className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-900 border-t">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Productos de la Orden
                        </h4>
                        <div className="space-y-2">
                            {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.products?.name || 'Producto'}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatCurrency(item.unit_price)} c/u
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Impuestos:</span>
                                <span className="font-medium">{formatCurrency(order.tax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
                            </div>
                            {order.payment_method === 'cash' && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pagó con:</span>
                                        <span className="font-medium">{formatCurrency(order.amount_paid)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Cambio:</span>
                                        <span className="font-medium">{formatCurrency(order.change_returned)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </div >
        </Collapsible >
    );
}

export default function ShiftDetailPage() {
    const params = useParams();
    const router = useRouter();
    const shiftId = params.id as string;

    const [shift, setShift] = useState<ShiftData | null>(null);
    const [stats, setStats] = useState<ShiftStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { isAdmin, loading: roleLoading } = useUserRole();

    useEffect(() => {
        if (shiftId) {
            loadShiftData();
        }
    }, [shiftId]);

    const loadShiftData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch shift data
            const { data: shiftData, error: shiftError } = await supabase
                .from('shifts')
                .select('*')
                .eq('id', shiftId)
                .single();

            if (shiftError) throw new Error(shiftError.message);
            setShift(shiftData);

            // Fetch orders with their items and product details
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price,
                        variant_name,
                        modifiers,
                        products (
                            name,
                            image_url
                        )
                    )
                `)
                .eq('shift_id', shiftId)
                .order('created_at', { ascending: false });

            if (ordersError) {
                console.error('Supabase error:', ordersError);
                throw new Error(ordersError.message);
            }

            const totalSales = orders?.reduce((acc, o) => acc + o.total_amount, 0) || 0;
            const cashSales = orders?.filter(o => o.payment_method === 'cash')
                .reduce((acc, o) => acc + o.total_amount, 0) || 0;
            const cardSales = orders?.filter(o => o.payment_method === 'card')
                .reduce((acc, o) => acc + o.total_amount, 0) || 0;
            const qrSales = orders?.filter(o => o.payment_method === 'qr')
                .reduce((acc, o) => acc + o.total_amount, 0) || 0;

            const cashOrders = orders?.filter(o => o.payment_method === 'cash').length || 0;
            const cardOrders = orders?.filter(o => o.payment_method === 'card').length || 0;
            const qrOrders = orders?.filter(o => o.payment_method === 'qr').length || 0;

            const newStats = {
                totalOrders: orders?.length || 0,
                totalSales,
                cashSales,
                cardSales,
                qrSales,
                cashOrders,
                cardOrders,
                qrOrders,
                averageTicket: orders?.length ? totalSales / orders.length : 0,
                orders: orders || [],
            };

            setStats(newStats);
        } catch (err: any) {
            console.error('Error loading shift details:', err);
            setError(err.message || 'Error desconocido al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    if (loading || roleLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (error || !shift || !stats) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/shifts">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Turnos
                            </Button>
                        </Link>
                        <Link href={isAdmin ? "/admin" : "/pos"}>
                            <Button variant="ghost">
                                {isAdmin ? "Ir al Panel" : "Ir al POS"} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-semibold mb-2">Error al cargar el turno</p>
                        <p className="text-gray-500 text-sm">{error || 'No se encontró el turno'}</p>
                        <Button
                            variant="outline"
                            onClick={loadShiftData}
                            className="mt-4"
                        >
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const difference = shift.end_cash !== null && shift.expected_cash !== null
        ? shift.end_cash - shift.expected_cash
        : null;
    const hasDifference = difference !== null && Math.abs(difference) > 0.01;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="outline" onClick={() => router.push('/shifts')} className="mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">Detalle del Turno</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(shift.start_time), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                    </div>
                    {shift.end_time ? (
                        <Badge variant="secondary">Cerrado</Badge>
                    ) : (
                        <Badge variant="default" className="bg-green-600">Activo</Badge>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Órdenes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                                <span className="text-2xl font-bold">{stats.totalOrders}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Ventas Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Ticket Promedio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Estado Caja</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {shift.end_cash !== null ? (
                                <Badge variant="secondary">Cerrado</Badge>
                            ) : (
                                <Badge variant="default" className="bg-green-600">Activo</Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Methods Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas por Método de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Cash */}
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-600 text-white rounded-lg">
                                        <DollarSign className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-800 dark:text-green-200">Efectivo</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">{stats.cashOrders} órdenes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                                        {formatCurrency(stats.cashSales)}
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        {stats.totalSales > 0 ? ((stats.cashSales / stats.totalSales) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Card */}
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-800 dark:text-blue-200">Tarjeta</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">{stats.cardOrders} órdenes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                        {formatCurrency(stats.cardSales)}
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {stats.totalSales > 0 ? ((stats.cardSales / stats.totalSales) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* QR */}
                            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                                        <Smartphone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-purple-800 dark:text-purple-200">QR / Digital</p>
                                        <p className="text-sm text-purple-600 dark:text-purple-400">{stats.qrOrders} órdenes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                        {formatCurrency(stats.qrSales)}
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                        {stats.totalSales > 0 ? ((stats.qrSales / stats.totalSales) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cash Reconciliation (if closed) */}
                {shift.end_cash !== null && shift.expected_cash !== null && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Arqueo de Caja</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Efectivo Inicial:</span>
                                    <span className="font-semibold">{formatCurrency(shift.start_cash)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">+ Ventas en Efectivo:</span>
                                    <span className="font-semibold">{formatCurrency(stats.cashSales)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="font-semibold">Efectivo Esperado:</span>
                                    <span className="font-bold">{formatCurrency(shift.expected_cash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Efectivo Real:</span>
                                    <span className="font-bold">{formatCurrency(shift.end_cash)}</span>
                                </div>
                                <Separator />
                                {hasDifference && difference !== null && (
                                    <div className={`flex items-center justify-between p-3 rounded-lg ${difference > 0
                                        ? 'bg-green-50 dark:bg-green-950'
                                        : 'bg-red-50 dark:bg-red-950'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            {difference > 0 ? (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    <span className="font-semibold text-green-800 dark:text-green-200">Sobrante:</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                                    <span className="font-semibold text-red-800 dark:text-red-200">Faltante:</span>
                                                </>
                                            )}
                                        </div>
                                        <span className={`text-xl font-bold ${difference > 0
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-red-800 dark:text-red-200'
                                            }`}>
                                            {formatCurrency(Math.abs(difference))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Orders List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Todas las Órdenes ({stats.totalOrders})</CardTitle>
                        <p className="text-sm text-gray-500 mt-2">
                            Haz clic en una orden para ver los productos
                        </p>
                    </CardHeader>
                    <CardContent>
                        {stats.orders && stats.orders.length > 0 ? (
                            <div className="space-y-3">
                                {stats.orders.map((order) => (
                                    <OrderDetailCard key={order.id} order={order} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No hay órdenes en este turno
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
