'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, ShoppingCart, ArrowLeft, Search, Save, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPurchasePage() {
    const router = useRouter();
    const { data: products = [] } = useProducts();
    const { suppliers } = useSuppliers();
    const { registerPurchase } = useInventoryMovements();

    // Form Header State
    const [supplierId, setSupplierId] = useState('');
    const [supplierSearch, setSupplierSearch] = useState(''); // New state
    const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false); // New state
    const [refNumber, setRefNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Item Entry State
    const [productSearch, setProductSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<{ id: string, name: string } | null>(null);
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Items List
    const [items, setItems] = useState<{ productId: string, productName: string, quantity: number, cost: number }[]>([]);

    // Refs for focus management
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter suggestions
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        !items.some(item => item.productId === p.id) // Exclude already added items? Optional.
    ).slice(0, 10); // Limit to 10 suggestions

    // Filter suppliers
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    ).slice(0, 10);

    const handleSelectSupplier = (supplier: { id: string, name: string }) => {
        setSupplierId(supplier.id);
        setSupplierSearch(supplier.name);
        setShowSupplierSuggestions(false);
    };

    const handleSelectProduct = (product: { id: string, name: string }) => {
        setSelectedProduct(product);
        setProductSearch(product.name);
        setShowSuggestions(false);
        // Focus quantity after selection
        setTimeout(() => quantityInputRef.current?.focus(), 100);
    };

    const handleAddItem = () => {
        if (!selectedProduct || !quantity) return;

        setItems([...items, {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: parseInt(quantity),
            cost: parseFloat(cost) || 0
        }]);

        // Reset entry fields and focus back to search
        setSelectedProduct(null);
        setProductSearch('');
        setQuantity('');
        setCost('');
        searchInputRef.current?.focus();
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSave = async () => {
        if (items.length === 0) {
            toast.error('Agrega al menos un producto a la compra');
            return;
        }
        if (!supplierId) {
            toast.error('Debes seleccionar un proveedor');
            return;
        }

        setSubmitting(true);
        const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Desconocido';

        const success = await registerPurchase(items, 'IN', 'Compra', notes, supplierName, refNumber);

        if (success) {
            toast.success('Compra registrada exitosamente');
            router.push('/inventory'); // Redirect back to inventory
        } else {
            setSubmitting(false);
        }
    };

    const totalCost = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/inventory">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6" /> Nueva Compra
                            </h1>
                            <p className="text-gray-500">Ingreso de mercadería al inventario</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/inventory">
                            <Button variant="ghost">Cancelar</Button>
                        </Link>
                        <Button onClick={handleSave} disabled={submitting || items.length === 0} className="bg-[#673de6] hover:bg-[#5a2fcc]">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Compra
                        </Button>
                    </div>
                </div>

                {/* Invoice Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Datos de la Factura</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 relative">
                                <Label>Proveedor *</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar proveedor..."
                                        className="pl-9"
                                        value={supplierSearch}
                                        onChange={(e) => {
                                            setSupplierSearch(e.target.value);
                                            setShowSupplierSuggestions(true);
                                            if (!e.target.value) setSupplierId('');
                                        }}
                                        onFocus={() => setShowSupplierSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSupplierSuggestions(false), 200)}
                                    />
                                    {supplierId && (
                                        <button
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setSupplierId('');
                                                setSupplierSearch('');
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Supplier Suggestions Dropdown */}
                                {showSupplierSuggestions && supplierSearch && !supplierId && (
                                    <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {filteredSuppliers.length > 0 ? (
                                            filteredSuppliers.map(s => (
                                                <div
                                                    key={s.id}
                                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                                    onMouseDown={() => handleSelectSupplier(s)}
                                                >
                                                    <div className="font-medium">{s.name}</div>
                                                    {s.tax_id && <div className="text-xs text-gray-500">RUC/ID: {s.tax_id}</div>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No encontrado.
                                                <Link href="/admin/suppliers" className="text-blue-600 hover:underline ml-1">Crear nuevo</Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="text-xs mt-1">
                                    <Link href="/admin/suppliers" className="text-blue-600 hover:underline">
                                        + Gestionar proveedores
                                    </Link>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>N° Factura / Referencia</Label>
                                <Input
                                    placeholder="Ej: F001-45678"
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notas / Observaciones</Label>
                                <Input
                                    placeholder="Opcional"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Entry Card */}
                <Card className="border-blue-200 dark:border-blue-900 shadow-sm">
                    <CardHeader className="bg-blue-50 dark:bg-blue-950/30 pb-3">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Agregar Productos a la Lista
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-4 items-end">
                            {/* Custom Autocomplete Search */}
                            <div className="col-span-12 md:col-span-5 space-y-2 relative">
                                <Label>Buscar Producto</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Escribe para buscar..."
                                        className="pl-9"
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            setShowSuggestions(true);
                                            if (!e.target.value) setSelectedProduct(null);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        // Delay blur to allow clicking suggestions
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    />
                                    {selectedProduct && (
                                        <button
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setProductSearch('');
                                                searchInputRef.current?.focus();
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Suggestions Dropdown */}
                                {showSuggestions && productSearch && !selectedProduct && (
                                    <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                                    onMouseDown={() => handleSelectProduct(p)} // onMouseDown fires before onBlur
                                                >
                                                    <div className="font-medium">{p.name}</div>
                                                    <div className="text-xs text-gray-500">Stock actual: {p.stock}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No se encontraron productos
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-6 md:col-span-2 space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                    ref={quantityInputRef}
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddItem();
                                    }}
                                />
                            </div>

                            <div className="col-span-6 md:col-span-3 space-y-2">
                                <Label>Costo Unitario (S/)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddItem();
                                    }}
                                />
                            </div>

                            <div className="col-span-12 md:col-span-2">
                                <Button
                                    onClick={handleAddItem}
                                    className="w-full"
                                    disabled={!selectedProduct || !quantity}
                                >
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Producto</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Costo Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">S/ {item.cost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold">S/ {(item.quantity * item.cost).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingCart className="h-8 w-8 text-gray-300" />
                                                <p>La lista de compra está vacía</p>
                                                <p className="text-xs">Busca productos arriba para agregarlos</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {items.length > 0 && (
                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t flex justify-end">
                            <div className="text-right">
                                <span className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Total a Pagar</span>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    S/ {totalCost.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
