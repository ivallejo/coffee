'use client';

import { useShifts } from '@/hooks/useShift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';

import { useUserRole } from '@/hooks/useUserRole';

export default function ShiftsPage() {
    const { data: shifts, isLoading: loading, refetch } = useShifts();
    const { isAdmin, loading: roleLoading } = useUserRole();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (loading || roleLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Historial de Turnos</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Gestiona y revisa los turnos de caja
                        </p>
                    </div>
                    <Link href={isAdmin ? "/admin" : "/pos"}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {isAdmin ? "Volver al Panel" : "Volver al POS"}
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Todos los Turnos</CardTitle>
                        <p className="text-sm text-gray-500 mt-2">
                            Haz clic en cualquier fila para ver el detalle completo del turno
                        </p>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={shifts || []}
                            pageSize={15}
                            emptyMessage="No hay turnos registrados"
                            columns={[
                                {
                                    header: 'Estado',
                                    accessor: (shift) => (
                                        shift.end_time ? (
                                            <Badge variant="secondary">Cerrado</Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-600">Activo</Badge>
                                        )
                                    )
                                },
                                {
                                    header: 'Cajero',
                                    accessor: (shift) => shift.cashier_id.substring(0, 8) + '...',
                                    className: 'hidden md:table-cell font-medium'
                                },
                                {
                                    header: 'Inicio',
                                    accessor: (shift) => (
                                        <div className="text-sm">
                                            {format(new Date(shift.start_time), "dd MMM", { locale: es })}
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(shift.start_time), "HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Fin',
                                    accessor: (shift) => (
                                        shift.end_time ? (
                                            <div className="text-sm">
                                                {format(new Date(shift.end_time), "dd MMM", { locale: es })}
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(shift.end_time), "HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                        ) : '-'
                                    ),
                                    className: 'hidden sm:table-cell'
                                },
                                {
                                    header: 'Efectivo Inicial',
                                    accessor: (shift) => formatCurrency(shift.start_cash),
                                    className: 'hidden lg:table-cell'
                                },
                                {
                                    header: 'Efectivo Final',
                                    accessor: (shift) => shift.end_cash !== null ? formatCurrency(shift.end_cash) : '-',
                                    className: 'hidden lg:table-cell'
                                },
                                {
                                    header: 'Esperado',
                                    accessor: (shift) => shift.expected_cash !== null ? formatCurrency(shift.expected_cash) : '-',
                                    className: 'hidden lg:table-cell'
                                },
                                {
                                    header: 'Diferencia',
                                    accessor: (shift) => {
                                        const difference = shift.end_cash && shift.expected_cash
                                            ? shift.end_cash - shift.expected_cash
                                            : null;
                                        const hasDifference = difference !== null && Math.abs(difference) > 0.01;

                                        return difference !== null ? (
                                            <div className="flex items-center gap-1">
                                                {hasDifference && (
                                                    difference > 0 ? (
                                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                                    )
                                                )}
                                                <span className={hasDifference ? (difference > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold') : ''}>
                                                    {formatCurrency(Math.abs(difference))}
                                                </span>
                                            </div>
                                        ) : '-';
                                    },
                                    className: 'hidden xl:table-cell'
                                },
                                {
                                    header: 'Acciones',
                                    accessor: (shift) => (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                router.push(`/shifts/${shift.id}`);
                                            }}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            <span className="hidden sm:inline">Ver Detalle</span>
                                        </Button>
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
