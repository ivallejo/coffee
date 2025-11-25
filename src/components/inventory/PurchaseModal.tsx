'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, ShoppingCart, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliers } from '@/hooks/useSuppliers';

interface Product {
    id: string;
    name: string;
    stock: number;
}

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onSave: (items: any[], supplier: string, refNumber: string, notes: string) => Promise<boolean>;
}

export function PurchaseModal({ isOpen, onClose, products, onSave }: PurchaseModalProps) {
    const { suppliers } = useSuppliers();
    const [supplierId, setSupplierId] = useState('');
    const [refNumber, setRefNumber] = useState('');
    const [notes, setNotes] = useState('');

    // Item entry state
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');

    // List of items to save
    const [items, setItems] = useState<{ productId: string, productName: string, quantity: number, cost: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    }, [products, productSearch]);

    const handleAddItem = () => {
        if (!selectedProductId || !quantity) return;

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        setItems([...items, {
            productId: selectedProductId,
            productName: product.name,
            quantity: parseInt(quantity),
            cost: parseFloat(cost) || 0
        }]);

        // Reset item inputs but keep search for convenience or clear it? Let's clear selection.
        setSelectedProductId('');
        setQuantity('');
        setCost('');
        setProductSearch(''); // Clear search to show all again
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSave = async () => {
        if (items.length === 0) {
            toast.error('Agrega al menos un producto');
            return;
        }
        if (!supplierId) {
            toast.error('Selecciona un proveedor');
            return;
        }

        setSubmitting(true);
        // Find supplier name for historical record if needed, or just pass ID
        const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Desconocido';

        // We pass the Supplier Name as the 'supplier' string field for now to match existing DB schema
        // Ideally we would pass ID, but the hook expects a string for the 'supplier' column.
        // Let's pass "Name" for the text column. 
        // TODO: Update hook to accept supplierId if we updated the DB column to be ID only.
        // For now, the DB has both 'supplier' (text) and 'supplier_id' (uuid). 
        // We will pass the Name to the 'supplier' arg, and we might need to update the hook to save the ID too.

        const success = await onSave(items, supplierName, refNumber, notes);
        setSubmitting(false);

        if (success) {
            setSupplierId('');
            setRefNumber('');
            setNotes('');
            setItems([]);
            onClose();
        }
    };

    const totalCost = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" /> Registrar Compra
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles de la factura y los productos recibidos.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Proveedor *</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-xs text-right">
                            <a href="/admin/suppliers" className="text-blue-600 hover:underline">Gestionar proveedores</a>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>N° Factura / Referencia</Label>
                        <Input
                            placeholder="Ej: F001-12345"
                            value={refNumber}
                            onChange={(e) => setRefNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notas Generales</Label>
                        <Input
                            placeholder="Opcional"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
                    <h4 className="font-medium text-sm">Agregar Productos</h4>
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 space-y-1">
                            <Label className="text-xs">Buscar Producto</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                                <Input
                                    placeholder="Filtrar..."
                                    className="pl-7 h-9 text-sm mb-1"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                            </div>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredProducts.slice(0, 50).map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-2 text-sm text-gray-500 text-center">No encontrado</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Cantidad</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="col-span-3 space-y-1">
                            <Label className="text-xs">Costo Unit. (S/)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="col-span-2">
                            <Button onClick={handleAddItem} className="w-full h-9" disabled={!selectedProductId || !quantity}>
                                <Plus className="h-4 w-4 mr-1" /> Agregar
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cant.</TableHead>
                                <TableHead className="text-right">Costo Unit.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">S/ {item.cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">S/ {(item.quantity * item.cost).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No hay productos agregados a la lista
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end items-center gap-4 py-2">
                    <div className="text-right">
                        <span className="text-sm text-gray-500">Total Factura:</span>
                        <div className="text-2xl font-bold">S/ {totalCost.toFixed(2)}</div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={submitting || items.length === 0}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Compra
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
