'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { Clock, User, Armchair } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TableSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tableNumber: string) => void;
}

export function TableSelectorModal({ isOpen, onClose, onConfirm }: TableSelectorModalProps) {
    const [table, setTable] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (table.trim()) {
            onConfirm(table.trim());
            setTable('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Asignar Mesa / Referencia</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Número de Mesa o Nombre</Label>
                        <Input
                            value={table}
                            onChange={e => setTable(e.target.value)}
                            placeholder="Ej. Mesa 5, Juan, Barra..."
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={!table.trim()} className="bg-brand-600 hover:bg-brand-700">
                            Guardar Cuenta
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface ActiveOrdersListProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOrder: (order: any) => void;
}

export function ActiveOrdersList({ isOpen, onClose, onSelectOrder }: ActiveOrdersListProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchOrders();
        }
    }, [isOpen]);

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customers(full_name),
                items:order_items(count)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        setOrders(data || []);
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Cuentas Abiertas / Mesas</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Cargando...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                            No hay cuentas pendientes
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex flex-col gap-2 relative group"
                                    onClick={() => onSelectOrder(order)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 font-bold text-lg text-brand-700 dark:text-brand-300">
                                            <Armchair className="h-5 w-5" />
                                            {order.table_number || 'Sin Mesa'}
                                        </div>
                                        <span className="font-mono font-bold">{formatCurrency(order.total_amount)}</span>
                                    </div>

                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                                    </div>

                                    {order.customer && (
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            {order.customer.full_name}
                                        </div>
                                    )}

                                    <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                                        {order.items[0].count} items
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
