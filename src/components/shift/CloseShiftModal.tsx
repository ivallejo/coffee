'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCloseShift } from '@/hooks/useShift';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/currency';

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    shiftId: string;
    startCash: number;
}

export function CloseShiftModal({ isOpen, onClose, shiftId, startCash }: CloseShiftModalProps) {
    const [endCash, setEndCash] = useState('');
    const [notes, setNotes] = useState('');
    const [shiftSummary, setShiftSummary] = useState<any>(null);
    const closeShift = useCloseShift();

    useEffect(() => {
        if (isOpen && shiftId) {
            loadShiftSummary();
        }
    }, [isOpen, shiftId]);

    const loadShiftSummary = async () => {
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, payment_method')
            .eq('shift_id', shiftId);

        const totalSales = orders?.reduce((acc, o) => acc + o.total_amount, 0) || 0;
        const cashSales = orders?.filter(o => o.payment_method === 'cash')
            .reduce((acc, o) => acc + o.total_amount, 0) || 0;
        const cardSales = orders?.filter(o => o.payment_method === 'card')
            .reduce((acc, o) => acc + o.total_amount, 0) || 0;
        const qrSales = orders?.filter(o => o.payment_method === 'qr')
            .reduce((acc, o) => acc + o.total_amount, 0) || 0;

        setShiftSummary({
            totalOrders: orders?.length || 0,
            totalSales,
            cashSales,
            cardSales,
            qrSales,
            expectedCash: startCash + cashSales,
        });
    };

    const handleClose = async () => {
        const amount = parseFloat(endCash);
        if (isNaN(amount) || amount < 0) {
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        try {
            await closeShift.mutateAsync({ shiftId, endCash: amount, notes });
            toast.success('Caja cerrada correctamente');
            setEndCash('');
            setNotes('');
            onClose();
        } catch (error: any) {
            toast.error('Error al cerrar caja: ' + error.message);
        }
    };

    const difference = shiftSummary ? parseFloat(endCash || '0') - shiftSummary.expectedCash : 0;
    const hasDifference = Math.abs(difference) > 0.01;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Cierre de Caja - Reporte Z</DialogTitle>
                    <DialogDescription>
                        Revisa el resumen de ventas y cuenta el efectivo en caja.
                    </DialogDescription>
                </DialogHeader>

                {shiftSummary && (
                    <div className="space-y-4 py-4">
                        {/* Summary */}
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                            <h3 className="font-semibold mb-3">Resumen del Turno</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Total de Órdenes:</div>
                                <div className="font-bold text-right">{shiftSummary.totalOrders}</div>

                                <div>Ventas Totales:</div>
                                <div className="font-bold text-right">{formatCurrency(shiftSummary.totalSales)}</div>

                                <Separator className="col-span-2 my-2" />

                                <div>💵 Efectivo:</div>
                                <div className="text-right">{formatCurrency(shiftSummary.cashSales)}</div>

                                <div>💳 Tarjeta:</div>
                                <div className="text-right">{formatCurrency(shiftSummary.cardSales)}</div>

                                <div>📱 QR:</div>
                                <div className="text-right">{formatCurrency(shiftSummary.qrSales)}</div>
                            </div>
                        </div>

                        {/* Cash Calculation */}
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                            <h3 className="font-semibold mb-3">Cálculo de Efectivo</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Efectivo Inicial:</div>
                                <div className="text-right">{formatCurrency(startCash)}</div>

                                <div>+ Ventas en Efectivo:</div>
                                <div className="text-right">{formatCurrency(shiftSummary.cashSales)}</div>

                                <Separator className="col-span-2 my-1" />

                                <div className="font-bold">Efectivo Esperado:</div>
                                <div className="font-bold text-right">{formatCurrency(shiftSummary.expectedCash)}</div>
                            </div>
                        </div>

                        {/* End Cash Input */}
                        <div className="space-y-2">
                            <Label htmlFor="end-cash">Efectivo Real en Caja</Label>
                            <Input
                                id="end-cash"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="text-lg"
                                value={endCash}
                                onChange={(e) => setEndCash(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Difference Alert */}
                        {endCash && hasDifference && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${difference > 0
                                ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
                                : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                                }`}>
                                {difference > 0 ? (
                                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-semibold">
                                        {difference > 0 ? 'Sobrante' : 'Faltante'}: {formatCurrency(Math.abs(difference))}
                                    </p>
                                    <p className="text-sm mt-1">
                                        {difference > 0
                                            ? 'Hay más efectivo del esperado. Por favor verifica.'
                                            : 'Falta efectivo. Por favor verifica el conteo y agrega notas si es necesario.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (Opcional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Agrega cualquier observación sobre el cierre de caja..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={closeShift.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleClose}
                        disabled={closeShift.isPending || !endCash}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {closeShift.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Cerrar Caja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
