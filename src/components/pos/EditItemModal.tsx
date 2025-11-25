'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CartItem } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CartItem | null;
    onSave: (uniqueId: string, updates: Partial<CartItem>) => void;
}

export function EditItemModal({ isOpen, onClose, item, onSave }: EditItemModalProps) {
    const [notes, setNotes] = useState('');
    const [price, setPrice] = useState('');
    const [isCustomPrice, setIsCustomPrice] = useState(false);

    useEffect(() => {
        if (item) {
            setNotes(item.notes || '');
            if (item.manualPrice !== undefined) {
                setPrice(item.manualPrice.toString());
                setIsCustomPrice(true);
            } else {
                // Calculate default price
                const base = item.product.base_price;
                const variant = item.variant?.price_adjustment || 0;
                const mods = item.modifiers.reduce((a, b) => a + b.price, 0);
                setPrice((base + variant + mods).toFixed(2));
                setIsCustomPrice(false);
            }
        }
    }, [item, isOpen]);

    const handleSave = () => {
        if (!item) return;

        const updates: Partial<CartItem> = {
            notes: notes.trim() || undefined
        };

        if (isCustomPrice) {
            const newPrice = parseFloat(price);
            if (!isNaN(newPrice) && newPrice >= 0) {
                updates.manualPrice = newPrice;
            }
        } else {
            updates.manualPrice = undefined; // Reset to default
        }

        onSave(item.uniqueId, updates);
        onClose();
    };

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar: {item.product.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Precio Unitario (S/)</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="customPrice"
                                    checked={isCustomPrice}
                                    onChange={(e) => setIsCustomPrice(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="customPrice" className="text-xs text-gray-500 cursor-pointer">
                                    Modificar Precio
                                </label>
                            </div>
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={!isCustomPrice}
                            className={isCustomPrice ? 'border-blue-500 bg-blue-50' : ''}
                        />
                        {isCustomPrice && (
                            <p className="text-xs text-yellow-600">
                                ⚠️ Estás modificando el precio original del producto.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Notas / Instrucciones</Label>
                        <Textarea
                            placeholder="Ej: Sin azúcar, extra caliente..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
