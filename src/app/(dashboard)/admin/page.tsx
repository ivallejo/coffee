'use client';

import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useCategories, useAllProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, DollarSign, ShoppingBag, Calendar, Package, LogOut, Gift, Truck, Search, Filter, X, TrendingUp, BarChart3, PieChart as PieChartIcon, Layers, Settings } from 'lucide-react';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
    const { data: orders, isLoading } = useSales();
    const { data: orderItems, isLoading: itemsLoading } = useOrderItems();
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: allProducts, isLoading: productsLoading } = useAllProducts();
    const router = useRouter();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    // Prepare chart data - MUST be before any conditional returns
    const chartData = useMemo(() => {
        if (!orders) return { dailySales: [], paymentMethods: [], topProducts: [], topCategories: [] };

        // Last 7 days sales logic
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i);
            const dayStart = startOfDay(date);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const daySales = orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= dayStart && orderDate <= dayEnd;
            });

            return {
                date: format(date, 'dd MMM', { locale: es }),
                ventas: daySales.reduce((sum, order) => sum + order.total_amount, 0),
                ordenes: daySales.length
            };
        });

        const paymentStats = orders.reduce((acc: any, order) => {
            const method = order.payment_method || 'cash';
            if (!acc[method]) {
                acc[method] = { name: method, value: 0, count: 0 };
            }
            acc[method].value += order.total_amount;
            acc[method].count += 1;
            return acc;
        }, {});

        const paymentMethods = Object.values(paymentStats).map((stat: any) => {
            let displayName = stat.name;
            if (stat.name === 'cash') displayName = 'Efectivo';
            else if (stat.name === 'card') displayName = 'Tarjeta';
            else if (stat.name === 'qr') displayName = 'QR';
            else displayName = stat.name.charAt(0).toUpperCase() + stat.name.slice(1); // Capitalize others

            return {
                name: displayName,
                value: stat.value,
                count: stat.count,
                code: stat.name // Keep original code for uniqueness if needed
            };
        });

        // Top products by quantity sold
        let topProducts: any[] = [];
        let topCategories: any[] = [];

        if (orderItems && orderItems.length > 0) {
            // Group by product
            const productStats = orderItems.reduce((acc: any, item) => {
                const productName = item.product_name || 'Desconocido';
                if (!acc[productName]) {
                    acc[productName] = { name: productName, quantity: 0, revenue: 0 };
                }
                acc[productName].quantity += item.quantity;
                acc[productName].revenue += item.total_price;
                return acc;
            }, {});

            topProducts = Object.values(productStats)
                .sort((a: any, b: any) => b.quantity - a.quantity)
                .slice(0, 5)
                .map((p: any) => ({
                    name: p.name,
                    value: p.quantity,
                    revenue: p.revenue
                }));

            // Group by category
            const categoryStats = orderItems.reduce((acc: any, item) => {
                // Find product to get category_id
                const product = allProducts?.find((p: any) => p.id === item.product_id);
                const categoryId = product?.category_id;
                const category = categories?.find((c: any) => c.id === categoryId);
                const categoryName = category?.name || 'Sin Categoría';

                if (!acc[categoryName]) {
                    acc[categoryName] = { name: categoryName, quantity: 0, revenue: 0 };
                }
                acc[categoryName].quantity += item.quantity;
                acc[categoryName].revenue += item.total_price;
                return acc;
            }, {});

            topCategories = Object.values(categoryStats)
                .sort((a: any, b: any) => b.quantity - a.quantity)
                .slice(0, 5)
                .map((c: any) => ({
                    name: c.name,
                    value: c.quantity,
                    revenue: c.revenue
                }));
        }

        return { dailySales: last7Days, paymentMethods, topProducts, topCategories };
    }, [orders, orderItems, categories, allProducts]);

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Error al cerrar sesión');
        } else {
            toast.success('Sesión cerrada');
            router.push('/login');
        }
    };

    // Conditional return AFTER all hooks
    if (isLoading || itemsLoading || categoriesLoading || productsLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    // Apply filters
    const filteredOrders = orders?.filter(order => {
        // Search filter (by order ID or cashier name)
        const matchesSearch = searchTerm === '' ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.cashier?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Payment method filter
        const matchesPayment = paymentMethodFilter === 'all' || order.payment_method === paymentMethodFilter;

        // Date filter
        let matchesDate = true;
        const orderDate = new Date(order.created_at);
        const today = new Date();

        if (dateFilter === 'today') {
            matchesDate = orderDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = orderDate >= monthAgo;
        }

        return matchesSearch && matchesPayment && matchesDate;
    }) || [];

    const totalSales = filteredOrders.reduce((acc, order) => acc + order.total_amount, 0);
    const totalOrders = filteredOrders.length;
    const todaySales = orders?.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, order) => acc + order.total_amount, 0) || 0;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Panel de Administración</h1>
                    <div className="flex gap-2">
                        <Link href="/pos">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Regresar al POS
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Salir
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de ventas</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                            <p className="text-xs text-muted-foreground">Ventas totales</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ventas de hoy</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(todaySales)}</div>
                            <p className="text-xs text-muted-foreground">Ventas para hoy</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de ventas</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                            <p className="text-xs text-muted-foreground">Transacciones completadas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Daily Sales Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Ventas Últimos 7 Días
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData.dailySales}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `S/ ${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [`S/ ${value.toFixed(2)}`, 'Ventas']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="ventas"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Ventas (S/)"
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Payment Methods Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    Métodos de Pago
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData.paymentMethods}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.paymentMethods.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => `S/ ${value.toFixed(2)}`}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-2">
                                {chartData.paymentMethods.map((method, index) => (
                                    <div key={`${method.name}-${index}`} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span>{method.name}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span className="text-gray-500">{method.count} órdenes</span>
                                            <span className="font-semibold">{formatCurrency(method.value)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products and Categories Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Products Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5 text-purple-600" />
                                    Top 5 Productos Más Vendidos
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                                {chartData.topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.topProducts}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.topProducts.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any, name: any, props: any) => [
                                                    `${value} unidades`,
                                                    props.payload.name
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-500">
                                        No hay datos de productos
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 space-y-2">
                                {chartData.topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="truncate max-w-[150px] font-medium">{product.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">{product.value} un.</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Categories Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5 text-orange-600" />
                                    Categorías Más Vendidas
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                                {chartData.topCategories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.topCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.topCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any, name: any, props: any) => [
                                                    `${value} unidades`,
                                                    props.payload.name
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-500">
                                        No hay datos de categorías
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 space-y-2">
                                {chartData.topCategories.map((category, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">{category.value} un.</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(category.revenue)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/inventory">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gestión de inventario</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar niveles de stock</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/sales">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Historial de Ventas</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Consultar ventas por período</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/products">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Catálogo de Productos</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar productos</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/categories">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                                <Layers className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar categorías de productos</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/suppliers">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
                                <Truck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar proveedores</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/shifts">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Turnos / Cierre de Caja</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Ver historial de turnos y cierres</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/loyalty">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Programa de Fidelidad</CardTitle>
                                <Gift className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar clientes y recompensas</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/users">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Usuarios y Roles</CardTitle>
                                <LogOut className="h-4 w-4 text-muted-foreground rotate-180" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Gestionar cajeros y permisos</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/settings">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Configuración</CardTitle>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Datos del negocio y tickets</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/admin/loyalty">
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Fidelidad</CardTitle>
                                <Gift className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Reglas y recompensas</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Recent Orders Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Órdenes recientes</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setPaymentMethodFilter('all');
                                        setDateFilter('all');
                                    }}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Limpiar Filtros
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Buscar por ID o cajero..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Payment Method Filter */}
                                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Método de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los métodos</SelectItem>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                        <SelectItem value="qr">QR</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Date Filter */}
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las fechas</SelectItem>
                                        <SelectItem value="today">Hoy</SelectItem>
                                        <SelectItem value="week">Última semana</SelectItem>
                                        <SelectItem value="month">Último mes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Results count */}
                            <div className="text-sm text-gray-500">
                                Mostrando {filteredOrders.length} de {orders?.length || 0} órdenes
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredOrders}
                            pageSize={10}
                            emptyMessage="No hay órdenes que coincidan con los filtros"
                            columns={[
                                {
                                    header: 'Orden',
                                    accessor: (order) => order.id.slice(0, 8) + '...',
                                    className: 'font-mono text-xs'
                                },
                                {
                                    header: 'Fecha',
                                    accessor: (order) => format(new Date(order.created_at), 'MMM d, HH:mm')
                                },
                                {
                                    header: 'Cajero',
                                    accessor: (order) => order.cashier?.full_name || 'Unknown'
                                },
                                {
                                    header: 'Método',
                                    accessor: (order) => order.payment_method || 'Cash',
                                    className: 'capitalize'
                                },
                                {
                                    header: 'Monto',
                                    accessor: (order) => formatCurrency(order.total_amount),
                                    className: 'text-right font-bold'
                                },
                                {
                                    header: 'Estado',
                                    accessor: (order) => (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {order.status}
                                        </span>
                                    ),
                                    className: 'text-right'
                                }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
