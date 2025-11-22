'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOpenShift } from '@/hooks/useShift';
import { toast } from 'sonner';
import { Loader2, DollarSign } from 'lucide-react';

interface OpenShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function OpenShiftModal({ isOpen, onClose, onSuccess }: OpenShiftModalProps) {
    const [startCash, setStartCash] = useState('');
    const openShift = useOpenShift();

    const handleOpen = async () => {
        const amount = parseFloat(startCash);
        if (isNaN(amount) || amount < 0) {
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        try {
            await openShift.mutateAsync(amount);
            toast.success('Caja aperturada correctamente');
            setStartCash('');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error al aperturar caja: ' + error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Apertura de Caja
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa el monto inicial en efectivo con el que comenzarás tu turno.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="start-cash">Efectivo Inicial</Label>
                        <Input
                            id="start-cash"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="text-lg"
                            value={startCash}
                            onChange={(e) => setStartCash(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Consejo:</strong> Cuenta cuidadosamente el efectivo antes de aperturar la caja.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={openShift.isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={handleOpen} disabled={openShift.isPending || !startCash} className="bg-green-600 hover:bg-green-700">
                        {openShift.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Aperturar Caja
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
