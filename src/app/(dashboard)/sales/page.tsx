'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Download, DollarSign, ShoppingBag, TrendingUp, CreditCard, Smartphone, Calendar, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    subtotal: number;
    tax: number;
    payment_method: 'cash' | 'card' | 'qr';
    status: string;
    cashier: {
        full_name: string;
    } | null;
    customer_phone: string | null;
    order_items: Array<{
        id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        products: {
            name: string;
        } | null;
    }>;
}

interface SalesStats {
    totalOrders: number;
    totalSales: number;
    averageTicket: number;
    cashSales: number;
    cardSales: number;
    qrSales: number;
    cashOrders: number;
    cardOrders: number;
    qrOrders: number;
}

export default function SalesHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSalesData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, startDate, endDate, paymentMethodFilter, searchQuery]);

    const loadSalesData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    cashier:profiles!orders_cashier_id_fkey(full_name),
                    order_items(
                        id,
                        quantity,
                        unit_price,
                        total_price,
                        products(name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            toast.error('Error al cargar ventas: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...orders];

        // Date range filter
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        filtered = filtered.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= start && orderDate <= end;
        });

        // Payment method filter
        if (paymentMethodFilter !== 'all') {
            filtered = filtered.filter(order => order.payment_method === paymentMethodFilter);
        }

        // Search filter (by cashier name or customer phone)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.cashier?.full_name?.toLowerCase().includes(query) ||
                order.customer_phone?.includes(query)
            );
        }

        setFilteredOrders(filtered);
        calculateStats(filtered);
    };

    const calculateStats = (ordersList: Order[]) => {
        const totalSales = ordersList.reduce((acc, o) => acc + o.total_amount, 0);
        const cashSales = ordersList.filter(o => o.payment_method === 'cash')
            .reduce((acc, o) => acc + o.total_amount, 0);
        const cardSales = ordersList.filter(o => o.payment_method === 'card')
            .reduce((acc, o) => acc + o.total_amount, 0);
        const qrSales = ordersList.filter(o => o.payment_method === 'qr')
            .reduce((acc, o) => acc + o.total_amount, 0);

        setStats({
            totalOrders: ordersList.length,
            totalSales,
            averageTicket: ordersList.length > 0 ? totalSales / ordersList.length : 0,
            cashSales,
            cardSales,
            qrSales,
            cashOrders: ordersList.filter(o => o.payment_method === 'cash').length,
            cardOrders: ordersList.filter(o => o.payment_method === 'card').length,
            qrOrders: ordersList.filter(o => o.payment_method === 'qr').length,
        });
    };

    const setQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
        const now = new Date();
        switch (range) {
            case 'today':
                setStartDate(format(now, 'yyyy-MM-dd'));
                setEndDate(format(now, 'yyyy-MM-dd'));
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                setStartDate(format(yesterday, 'yyyy-MM-dd'));
                setEndDate(format(yesterday, 'yyyy-MM-dd'));
                break;
            case 'week':
                setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
                setEndDate(format(now, 'yyyy-MM-dd'));
                break;
            case 'month':
                setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
                break;
        }
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Hora', 'Cajero', 'Método de Pago', 'Productos', 'Subtotal', 'Impuestos', 'Total'];
        const rows = filteredOrders.map(order => [
            format(new Date(order.created_at), 'dd/MM/yyyy'),
            format(new Date(order.created_at), 'HH:mm:ss'),
            order.cashier?.full_name || 'N/A',
            order.payment_method,
            order.order_items?.length || 0,
            order.subtotal.toFixed(2),
            order.tax.toFixed(2),
            order.total_amount.toFixed(2),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ventas_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Reporte exportado exitosamente');
    };

    const clearFilters = () => {
        setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethodFilter('all');
        setSearchQuery('');
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'card': return 'Tarjeta';
            case 'qr': return 'QR';
            default: return method;
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <DollarSign className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'qr': return <Smartphone className="h-4 w-4" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Historial de Ventas</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Consulta y analiza tus ventas por período
                        </p>
                    </div>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Limpiar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Quick Date Ranges */}
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('today')}>
                                Hoy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('yesterday')}>
                                Ayer
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                                Últimos 7 días
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                                Este mes
                            </Button>
                        </div>

                        <Separator />

                        {/* Custom Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Fecha Inicio</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">Fecha Fin</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Método de Pago</Label>
                                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger id="payment-method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                        <SelectItem value="qr">QR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="search">Buscar</Label>
                                <Input
                                    id="search"
                                    placeholder="Cajero o teléfono..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        <span className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Período</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-orange-600" />
                                        <span className="text-sm font-semibold">
                                            {format(new Date(startDate), 'dd/MM', { locale: es })} - {format(new Date(endDate), 'dd/MM', { locale: es })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Methods Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Desglose por Método de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            <p className="text-xl font-bold text-green-800 dark:text-green-200">
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
                                            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
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
                                            <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
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
                    </>
                )}

                {/* Orders Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Órdenes ({filteredOrders.length})</CardTitle>
                            <Button onClick={exportToCSV} disabled={filteredOrders.length === 0}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredOrders}
                            pageSize={25}
                            emptyMessage="No hay órdenes en el período seleccionado"
                            columns={[
                                {
                                    header: 'Fecha/Hora',
                                    accessor: (order) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(new Date(order.created_at), 'dd/MM/yyyy')}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {format(new Date(order.created_at), 'HH:mm:ss')}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Cajero',
                                    accessor: (order) => order.cashier?.full_name || 'N/A'
                                },
                                {
                                    header: 'Método',
                                    accessor: (order) => (
                                        <div className="flex items-center gap-2">
                                            {getPaymentMethodIcon(order.payment_method)}
                                            <span>{getPaymentMethodLabel(order.payment_method)}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Items',
                                    accessor: (order) => order.order_items?.length || 0,
                                    className: 'text-center'
                                },
                                {
                                    header: 'Subtotal',
                                    accessor: (order) => formatCurrency(order.subtotal),
                                    className: 'text-right'
                                },
                                {
                                    header: 'Impuestos',
                                    accessor: (order) => formatCurrency(order.tax),
                                    className: 'text-right'
                                },
                                {
                                    header: 'Total',
                                    accessor: (order) => formatCurrency(order.total_amount),
                                    className: 'text-right font-bold'
                                },
                                {
                                    header: 'Estado',
                                    accessor: (order) => (
                                        <Badge variant="secondary" className="capitalize">
                                            {order.status}
                                        </Badge>
                                    )
                                }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
