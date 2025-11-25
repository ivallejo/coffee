'use client';

import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownLeft, Search, Filter, Plus, Loader2, AlertTriangle, Package, X, History, Pencil, Save, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function InventoryPage() {
    const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useProducts();
    const {
        movements,
        loading: movementsLoading,
        totalCount,
        filters,
        updateFilters,
        setPage,
        addMovement,
        registerPurchase,
        refetch: refetchMovements
    } = useInventoryMovements();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [users, setUsers] = useState<{ id: string, full_name: string }[]>([]);

    // Price Edit State
    const [editingPriceProduct, setEditingPriceProduct] = useState<any>(null);
    const [newPrice, setNewPrice] = useState('');
    const [updatingPrice, setUpdatingPrice] = useState(false);

    // Fetch users for filter
    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name');
            if (data) setUsers(data);
        };
        fetchUsers();
    }, []);

    const filteredProducts = (products || []).filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (product: any, type: 'IN' | 'OUT') => {
        setSelectedProduct(product);
        setMovementType(type);
        setQuantity('');
        setReason('');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleUpdatePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPriceProduct || !newPrice) return;

        setUpdatingPrice(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({ base_price: parseFloat(newPrice) })
                .eq('id', editingPriceProduct.id);

            if (error) throw error;

            toast.success('Precio actualizado correctamente');
            setEditingPriceProduct(null);
            refetchProducts();
        } catch (error: any) {
            toast.error('Error al actualizar precio');
            console.error(error);
        } finally {
            setUpdatingPrice(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !quantity || !reason) return;

        setSubmitting(true);
        const success = await addMovement(
            selectedProduct.id,
            movementType,
            parseInt(quantity),
            reason,
            notes
        );

        if (success) {
            setIsModalOpen(false);
            refetchProducts();
            refetchMovements();
        }
        setSubmitting(false);
    };

    const getReasonOptions = (type: 'IN' | 'OUT') => {
        if (type === 'IN') {
            return ['Compra', 'Devolución', 'Ajuste Inicial', 'Producción', 'Otro'];
        }
        return ['Venta (Manual)', 'Merma / Daño', 'Vencimiento', 'Uso Interno', 'Robo / Pérdida', 'Ajuste', 'Otro'];
    };

    const totalPages = Math.ceil(totalCount / (filters.pageSize || 10));

    if (productsLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4">
                <Link href="/admin" className="w-fit">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Dashboard
                    </Button>
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Inventario</h1>
                        <p className="text-gray-500">Gestiona el stock y registra movimientos</p>
                    </div>
                    <Link href="/admin/purchases/new">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Compra
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Valor del Inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            S/ {products.reduce((acc, p) => acc + (p.base_price * p.stock), 0).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Stock Bajo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {products.filter(p => p.stock <= 5).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="stock" className="w-full">
                <TabsList>
                    <TabsTrigger value="stock">Stock Actual</TabsTrigger>
                    <TabsTrigger value="history">Historial de Movimientos</TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Buscar producto..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg bg-white dark:bg-gray-900">
                        <DataTable
                            data={filteredProducts}
                            pageSize={20}
                            emptyMessage="No se encontraron productos"
                            columns={[
                                {
                                    header: 'Producto',
                                    accessor: (product) => product.name,
                                    className: 'font-medium'
                                },
                                {
                                    header: 'Categoría',
                                    accessor: (product) => product.category?.name || 'Sin Categoría'
                                },
                                {
                                    header: 'Costo Unit.',
                                    accessor: (product) => `S/ ${(product.cost_price || 0).toFixed(2)}`,
                                    className: 'text-right text-gray-500'
                                },
                                {
                                    header: 'Precio Venta',
                                    accessor: (product) => (
                                        <div className="flex items-center justify-end gap-2 group">
                                            <span className="font-medium">S/ {product.base_price.toFixed(2)}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setEditingPriceProduct(product);
                                                    setNewPrice(product.base_price.toString());
                                                }}
                                                title="Editar Precio Base"
                                            >
                                                <Pencil className="h-3 w-3 text-gray-500" />
                                            </Button>
                                        </div>
                                    ),
                                    className: 'text-right'
                                },
                                {
                                    header: 'Stock',
                                    accessor: (product) => (
                                        <span className={`font-bold ${product.stock <= (product.min_stock || 5) ? 'text-red-500' : 'text-[#673de6]'}`}>
                                            {product.stock}
                                        </span>
                                    ),
                                    className: 'text-center'
                                },
                                {
                                    header: 'Estado',
                                    accessor: (product) => (
                                        product.stock <= (product.min_stock || 5) ? (
                                            <Badge variant="destructive" className="text-xs">Bajo Stock</Badge>
                                        ) : null
                                    ),
                                    className: 'text-center'
                                },
                                {
                                    header: 'Acciones',
                                    accessor: (product) => (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleOpenModal(product, 'IN')}>
                                                <Plus className="h-4 w-4 text-[#673de6]" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleOpenModal(product, 'OUT')}>
                                                <ArrowRight className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    ),
                                    className: 'text-right'
                                }
                            ]}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {/* Filters Bar */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Desde</Label>
                                    <Input
                                        type="date"
                                        value={filters.startDate || ''}
                                        onChange={(e) => updateFilters({ startDate: e.target.value || null })}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Hasta</Label>
                                    <Input
                                        type="date"
                                        value={filters.endDate || ''}
                                        onChange={(e) => updateFilters({ endDate: e.target.value || null })}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Tipo</Label>
                                    <Select
                                        value={filters.type || 'all'}
                                        onValueChange={(val) => updateFilters({ type: val as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="IN">Entradas</SelectItem>
                                            <SelectItem value="OUT">Salidas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Producto</Label>
                                    <Select
                                        value={filters.productId || 'all'}
                                        onValueChange={(val) => updateFilters({ productId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Usuario</Label>
                                    <Select
                                        value={filters.userId || 'all'}
                                        onValueChange={(val) => updateFilters({ userId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full text-gray-500 hover:text-gray-900"
                                    onClick={() => updateFilters({
                                        startDate: null,
                                        endDate: null,
                                        type: 'all',
                                        productId: 'all',
                                        userId: 'all',
                                        reason: 'all'
                                    })}
                                >
                                    <X className="mr-2 h-4 w-4" /> Limpiar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Movimientos</span>
                                <span className="text-sm font-normal text-gray-500">
                                    Total: {totalCount} registros
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                {movementsLoading && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                )}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Motivo</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Notas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                                    {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                                </TableCell>
                                                <TableCell className="font-medium">{movement.products?.name || 'Desconocido'}</TableCell>
                                                <TableCell>
                                                    {movement.type === 'IN' ? (
                                                        <Badge className="bg-[#673de6]/10 text-[#673de6] hover:bg-[#673de6]/20 border-[#673de6]/30">
                                                            <ArrowUpCircle className="w-3 h-3 mr-1" /> Entrada
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                                                            <ArrowDownCircle className="w-3 h-3 mr-1" /> Salida
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                                </TableCell>
                                                <TableCell>{movement.reason}</TableCell>
                                                <TableCell className="text-sm text-gray-500">{movement.profiles?.full_name || 'Sistema'}</TableCell>
                                                <TableCell className="text-sm text-gray-400 max-w-[200px] truncate" title={movement.notes || ''}>
                                                    {movement.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!movementsLoading && movements.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                    No se encontraron movimientos con los filtros seleccionados
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4 border-t pt-4">
                                <div className="text-sm text-gray-500">
                                    Página {filters.page} de {totalPages || 1}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((filters.page || 1) - 1)}
                                        disabled={(filters.page || 1) <= 1 || movementsLoading}
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((filters.page || 1) + 1)}
                                        disabled={(filters.page || 1) >= totalPages || movementsLoading}
                                    >
                                        Siguiente <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Movement Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {movementType === 'IN' ? 'Registrar Entrada' : 'Registrar Salida'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.name} - Stock Actual: {selectedProduct?.stock}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Select value={reason} onValueChange={setReason} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un motivo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getReasonOptions(movementType).map((opt) => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas (Opcional)</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className={movementType === 'IN' ? 'bg-[#673de6] hover:bg-[#5a2fcc]' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar {movementType === 'IN' ? 'Entrada' : 'Salida'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Price Edit Modal */}
            <Dialog open={!!editingPriceProduct} onOpenChange={(open) => !open && setEditingPriceProduct(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Precio Base</DialogTitle>
                        <DialogDescription>
                            Actualiza el precio de venta para {editingPriceProduct?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePrice} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nuevo Precio (S/)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingPriceProduct(null)}>Cancelar</Button>
                            <Button type="submit" disabled={updatingPrice}>
                                {updatingPrice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
