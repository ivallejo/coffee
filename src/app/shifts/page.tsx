'use client';

import { useShifts } from '@/hooks/useShift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="hidden md:table-cell">Cajero</TableHead>
                                        <TableHead>Inicio</TableHead>
                                        <TableHead className="hidden sm:table-cell">Fin</TableHead>
                                        <TableHead className="hidden lg:table-cell">Efectivo Inicial</TableHead>
                                        <TableHead className="hidden lg:table-cell">Efectivo Final</TableHead>
                                        <TableHead className="hidden lg:table-cell">Esperado</TableHead>
                                        <TableHead className="hidden xl:table-cell">Diferencia</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shifts?.map((shift) => {
                                        const difference = shift.end_cash && shift.expected_cash
                                            ? shift.end_cash - shift.expected_cash
                                            : null;
                                        const hasDifference = difference !== null && Math.abs(difference) > 0.01;

                                        return (
                                            <TableRow
                                                key={shift.id}
                                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => router.push(`/shifts/${shift.id}`)}
                                            >
                                                <TableCell>
                                                    {shift.end_time ? (
                                                        <Badge variant="secondary">Cerrado</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-green-600">Activo</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-medium">
                                                    {shift.cashier_id.substring(0, 8)}...
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(new Date(shift.start_time), "dd MMM", { locale: es })}
                                                        <br />
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(shift.start_time), "HH:mm", { locale: es })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {shift.end_time ? (
                                                        <div className="text-sm">
                                                            {format(new Date(shift.end_time), "dd MMM", { locale: es })}
                                                            <br />
                                                            <span className="text-xs text-gray-500">
                                                                {format(new Date(shift.end_time), "HH:mm", { locale: es })}
                                                            </span>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">{formatCurrency(shift.start_cash)}</TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {shift.end_cash !== null ? formatCurrency(shift.end_cash) : '-'}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell">
                                                    {shift.expected_cash !== null ? formatCurrency(shift.expected_cash) : '-'}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell">
                                                    {difference !== null ? (
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
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/shifts/${shift.id}`);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        <span className="hidden sm:inline">Ver Detalle</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {shifts?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                                                No hay turnos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
