'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, DollarSign, CreditCard, Smartphone, ShoppingBag, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShiftDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    shiftId: string;
    startCash: number;
    endCash: number | null;
    expectedCash: number | null;
}

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

// Order Detail Card Component
function OrderDetailCard({ order }: { order: any }) {
    const [isOpen, setIsOpen] = useState(false);

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
                            <Separator orientation="vertical" className="h-10" />
                            <div>
                                <p className="text-xs text-gray-500">Productos</p>
                                <p className="font-medium">{itemCount} items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-green-600">
                                    ${order.total_amount.toFixed(2)}
                                </p>
                            </div>
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
                                                ${item.unit_price.toFixed(2)} c/u
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Impuestos:</span>
                                <span className="font-medium">${order.tax.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">${order.total_amount.toFixed(2)}</span>
                            </div>
                            {order.payment_method === 'cash' && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pagó con:</span>
                                        <span className="font-medium">${order.amount_paid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Cambio:</span>
                                        <span className="font-medium">${order.change_returned.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}


export function ShiftDetailModal({ isOpen, onClose, shiftId, startCash, endCash, expectedCash }: ShiftDetailModalProps) {
    const [stats, setStats] = useState<ShiftStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && shiftId) {
            loadShiftDetails();
        }
    }, [isOpen, shiftId]);

    const loadShiftDetails = async () => {
        setLoading(true);
        setError(null);
        try {
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
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const difference = endCash !== null && expectedCash !== null ? endCash - expectedCash : null;
    const hasDifference = difference !== null && Math.abs(difference) > 0.01;

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Detalle del Turno</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
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
                                        <span className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Ticket Promedio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.averageTicket.toFixed(2)}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Estado Caja</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {endCash !== null ? (
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
                                                ${stats.cashSales.toFixed(2)}
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
                                                ${stats.cardSales.toFixed(2)}
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
                                                ${stats.qrSales.toFixed(2)}
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
                        {endCash !== null && expectedCash !== null && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Arqueo de Caja</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Efectivo Inicial:</span>
                                            <span className="font-semibold">${startCash.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">+ Ventas en Efectivo:</span>
                                            <span className="font-semibold">${stats.cashSales.toFixed(2)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Efectivo Esperado:</span>
                                            <span className="font-bold">${expectedCash.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Efectivo Real:</span>
                                            <span className="font-bold">${endCash.toFixed(2)}</span>
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
                                                    ${Math.abs(difference).toFixed(2)}
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
                ) : error ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-semibold mb-2">Error al cargar el turno</p>
                        <p className="text-gray-500 text-sm">{error}</p>
                        <Button
                            variant="outline"
                            onClick={loadShiftDetails}
                            className="mt-4"
                        >
                            Reintentar
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No se pudo cargar la información del turno
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
