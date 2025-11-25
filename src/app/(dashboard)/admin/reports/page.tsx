'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    CreditCard,
    ArrowLeft,
    FileText,
    DollarSign
} from 'lucide-react';

export default function ReportsPage() {
    const reportCategories = [
        {
            title: "Reportes de Ventas",
            description: "Análisis detallado de ventas y rendimiento",
            reports: [
                {
                    title: "Todas las Ventas",
                    description: "Visualiza el detalle de todas tus ventas por comprobantes.",
                    icon: FileText,
                    href: "/admin/reports/sales",
                    color: "text-green-600 bg-green-100"
                },
                {
                    title: "Ventas por Empleado",
                    description: "Visualiza la cantidad, descuentos y total de ventas realizadas por los empleados.",
                    icon: Users,
                    href: "/admin/reports/sales?tab=employees",
                    color: "text-blue-600 bg-blue-100"
                },
                {
                    title: "Ventas por Producto",
                    description: "Conoce cuales fueron los productos más vendidos y con más ingresos.",
                    icon: Package,
                    href: "/admin/reports/sales?tab=products",
                    color: "text-purple-600 bg-purple-100"
                },
                {
                    title: "Ventas por Cliente",
                    description: "Conoce cuales fueron tus clientes que más gastaron o que más productos compraron.",
                    icon: Users,
                    href: "/admin/reports/sales?tab=customers",
                    color: "text-orange-600 bg-orange-100"
                },
                {
                    title: "Métodos de Pago",
                    description: "Conoce cuales fueron los métodos de pago con más ingresos y la cantidad de transacciones.",
                    icon: CreditCard,
                    href: "/admin/reports/sales?tab=payment-methods",
                    color: "text-indigo-600 bg-indigo-100"
                }
            ]
        },
        {
            title: "Reportes del Punto de Venta",
            description: "Análisis de operaciones de caja",
            reports: [
                {
                    title: "Apertura y Cierre de Caja",
                    description: "Visualiza el movimiento de entradas de dinero, las ventas, anulaciones y los resultados por cada uno de los turnos en el punto de venta.",
                    icon: DollarSign,
                    href: "/shifts",
                    color: "text-emerald-600 bg-emerald-100"
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Todos los Reportes</h1>
                        <p className="text-muted-foreground mt-1">Análisis y estadísticas de tu negocio</p>
                    </div>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
                        </Button>
                    </Link>
                </div>

                {reportCategories.map((category, idx) => (
                    <div key={idx} className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">{category.title}</h2>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.reports.map((report, reportIdx) => (
                                <Link key={reportIdx} href={report.href}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${report.color}`}>
                                                    <report.icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">{report.title}</CardTitle>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="text-sm">
                                                {report.description}
                                            </CardDescription>
                                            <Button variant="link" className="mt-4 p-0 h-auto text-brand-600">
                                                Ver reporte →
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
