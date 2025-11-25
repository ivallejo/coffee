'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Download, Calendar, Search } from 'lucide-react';
import { useSalesReports, getDateRangePreset, DateRange } from '@/hooks/useSalesReports';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useSearchParams } from 'next/navigation';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function SalesReportPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'sales';

    const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth'>('today');
    const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset('today'));
    const [activeTab, setActiveTab] = useState(initialTab);

    const { salesOverview, employeeSales, productSales, customerSales, isLoading } = useSalesReports(dateRange);

    const handlePresetChange = (preset: typeof datePreset) => {
        setDatePreset(preset);
        setDateRange(getDateRangePreset(preset));
    };

    // Payment methods chart data
    const paymentMethodsData = salesOverview?.byPaymentMethod.map(pm => ({
        name: pm.method === 'cash' ? 'Efectivo' :
            pm.method === 'card' ? 'Tarjeta' :
                pm.method === 'yape' ? 'Yape' :
                    pm.method === 'plin' ? 'Plin' :
                        pm.method === 'transfer' ? 'Transferencia' : pm.method,
        value: pm.total,
        count: pm.count
    })) || [];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Reportes de Ventas</h1>
                        <p className="text-muted-foreground mt-1">Análisis detallado de tus ventas</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Exportar
                        </Button>
                        <Link href="/admin/reports">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Date Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={datePreset === 'today' ? 'default' : 'outline'}
                                onClick={() => handlePresetChange('today')}
                                size="sm"
                            >
                                Hoy
                            </Button>
                            <Button
                                variant={datePreset === 'yesterday' ? 'default' : 'outline'}
                                onClick={() => handlePresetChange('yesterday')}
                                size="sm"
                            >
                                Ayer
                            </Button>
                            <Button
                                variant={datePreset === 'last7days' ? 'default' : 'outline'}
                                onClick={() => handlePresetChange('last7days')}
                                size="sm"
                            >
                                Últimos 7 días
                            </Button>
                            <Button
                                variant={datePreset === 'last30days' ? 'default' : 'outline'}
                                onClick={() => handlePresetChange('last30days')}
                                size="sm"
                            >
                                Últimos 30 días
                            </Button>
                            <Button
                                variant={datePreset === 'thisMonth' ? 'default' : 'outline'}
                                onClick={() => handlePresetChange('thisMonth')}
                                size="sm"
                            >
                                Este mes
                            </Button>
                            <div className="flex items-center gap-2 ml-auto">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {format(dateRange.from, 'dd MMM yyyy', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="sales">Ventas</TabsTrigger>
                        <TabsTrigger value="customers">Clientes</TabsTrigger>
                        <TabsTrigger value="employees">Empleados</TabsTrigger>
                        <TabsTrigger value="products">Productos</TabsTrigger>
                        <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
                    </TabsList>

                    {/* Sales Tab */}
                    <TabsContent value="sales" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Total de Ventas</CardTitle>
                                    <CardDescription>Monto total vendido en el período</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-green-600">
                                        {formatCurrency(salesOverview?.total || 0)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {salesOverview?.count || 0} ventas realizadas
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Ventas</CardTitle>
                                    <CardDescription>Distribución por período</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={[{ name: 'Ventas', value: salesOverview?.total || 0 }]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Bar dataKey="value" fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Customers Tab */}
                    <TabsContent value="customers" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top 5 de Ventas por Clientes</CardTitle>
                                    <CardDescription>Clientes con mayores compras</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {customerSales?.map((customer, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{customer.customer_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customer.purchase_count} compras
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">
                                                        {formatCurrency(customer.total_purchases)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customer.products_count} productos
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Ventas por Tipo de Cliente</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={customerSales || []}
                                                dataKey="total_purchases"
                                                nameKey="customer_name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {customerSales?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Employees Tab */}
                    <TabsContent value="employees" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top 5 de Ventas por Empleados</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {employeeSales?.slice(0, 5).map((employee, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{employee.employee_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {employee.sales_count} ventas
                                                    </p>
                                                </div>
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(employee.total_sales)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Ventas por Empleado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={employeeSales?.slice(0, 5) || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="employee_name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Bar dataKey="total_sales" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent value="products" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ventas por Producto</CardTitle>
                                <CardDescription>Productos más vendidos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {productSales?.slice(0, 10).map((product, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{product.product_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {product.quantity_sold} unidades vendidas
                                                </p>
                                            </div>
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(product.total_revenue)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment Methods Tab */}
                    <TabsContent value="payment-methods" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ventas por Método de Pago</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {paymentMethodsData.map((method, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{method.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {method.count} transacciones
                                                    </p>
                                                </div>
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(method.value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribución de Métodos de Pago</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={paymentMethodsData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {paymentMethodsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
