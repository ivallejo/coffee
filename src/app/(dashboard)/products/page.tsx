'use client';

import { useState } from 'react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, Package, Search, ChefHat, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductsPage() {
    const { data: products, isLoading: loadingProducts, refetch } = useProducts();
    const { data: categories, isLoading: loadingCategories } = useCategories();

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        base_price: '',
        description: '',
        image_url: '',
        unit_of_measure: 'UND',
        product_type: 'simple' as 'simple' | 'composite',
        cost_price: '0'
    });

    // Recipe Builder State
    const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
    const [currentIngredientId, setCurrentIngredientId] = useState('');
    const [currentIngredientQty, setCurrentIngredientQty] = useState('1');

    // Ingredient Search State
    const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
    const [isIngredientSearchOpen, setIsIngredientSearchOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    // --- Helpers ---

    const resetForm = () => {
        setFormData({
            name: '',
            category_id: '',
            base_price: '',
            description: '',
            image_url: '',
            unit_of_measure: 'UND',
            product_type: 'simple',
            cost_price: '0'
        });
        setRecipeIngredients([]);
        setEditingId(null);
        setCurrentIngredientId('');
        setCurrentIngredientQty('1');
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = async (product: Product) => {
        resetForm();
        setEditingId(product.id);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            base_price: product.base_price.toString(),
            description: product.description || '',
            image_url: product.image_url || '',
            unit_of_measure: product.unit_of_measure || 'UND',
            product_type: (product.product_type as any) || 'simple',
            cost_price: (product.cost_price || 0).toString()
        });

        // Fetch existing recipe if composite
        if (product.product_type === 'composite') {
            const { data: recipes } = await supabase
                .from('product_recipes')
                .select('*, ingredient:ingredient_product_id(name, unit_of_measure)')
                .eq('parent_product_id', product.id);

            if (recipes) {
                setRecipeIngredients(recipes.map((r: any) => ({
                    ingredient_product_id: r.ingredient_product_id,
                    name: r.ingredient?.name,
                    unit: r.ingredient?.unit_of_measure,
                    quantity: r.quantity
                })));
            }
        }

        setIsDialogOpen(true);
    };

    // --- Recipe Logic ---

    const addIngredientToRecipe = () => {
        if (!currentIngredientId || !currentIngredientQty) return;

        const product = products?.find(p => p.id === currentIngredientId);
        if (!product) return;

        // Check if already exists
        if (recipeIngredients.some(i => i.ingredient_product_id === currentIngredientId)) {
            toast.error('Este ingrediente ya está en la receta');
            return;
        }

        setRecipeIngredients([...recipeIngredients, {
            ingredient_product_id: product.id,
            name: product.name,
            unit: product.unit_of_measure,
            quantity: parseFloat(currentIngredientQty)
        }]);

        setCurrentIngredientId('');
        setCurrentIngredientQty('1');
    };

    const removeIngredientFromRecipe = (index: number) => {
        const newIngredients = [...recipeIngredients];
        newIngredients.splice(index, 1);
        setRecipeIngredients(newIngredients);
    };

    // --- Persistence ---

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Por favor ingresa el nombre del producto');
            return;
        }
        if (!formData.category_id) {
            toast.error('Por favor selecciona una categoría');
            return;
        }
        if (!formData.base_price) {
            toast.error('Por favor ingresa el precio de venta');
            return;
        }

        try {
            let productId = editingId;

            // 1. Upsert Product
            const productPayload = {
                name: formData.name,
                category_id: formData.category_id,
                base_price: parseFloat(formData.base_price),
                description: formData.description || null,
                image_url: formData.image_url || null,
                unit_of_measure: formData.unit_of_measure,
                product_type: formData.product_type,
                cost_price: parseFloat(formData.cost_price || '0'),
                is_available: true
            };

            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update(productPayload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert(productPayload)
                    .select()
                    .single();
                if (error) throw error;
                productId = data.id;
            }

            // 2. Handle Recipe (if composite)
            if (formData.product_type === 'composite' && productId) {
                // Strategy: Delete all existing recipes for this product and re-insert current state
                // This handles additions, removals, and updates in one go.

                // A. Delete old
                await supabase.from('product_recipes').delete().eq('parent_product_id', productId);

                // B. Insert new
                if (recipeIngredients.length > 0) {
                    const recipesToInsert = recipeIngredients.map(i => ({
                        parent_product_id: productId,
                        ingredient_product_id: i.ingredient_product_id,
                        quantity: i.quantity
                    }));

                    const { error: recipeError } = await supabase
                        .from('product_recipes')
                        .insert(recipesToInsert);

                    if (recipeError) throw recipeError;
                }
            }

            toast.success(editingId ? 'Producto actualizado' : 'Producto creado');
            setIsDialogOpen(false);
            refetch();
        } catch (error: any) {
            console.error(error);
            toast.error('Error al guardar: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        const { error } = await supabase.from('products').update({ is_available: false }).eq('id', id);
        if (error) toast.error(error.message);
        else {
            toast.success('Producto eliminado');
            refetch();
        }
    };

    // --- Render ---

    const filteredProducts = products?.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    }) || [];

    if (loadingProducts || loadingCategories) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    // Filter ingredients list (exclude self and already added)
    const availableIngredients = products?.filter(p =>
        p.id !== editingId && // Can't contain itself
        !recipeIngredients.some(ri => ri.ingredient_product_id === p.id)
    ) || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Productos</h1>
                        <p className="text-gray-500">Gestiona tu inventario y recetas</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenAdd} className="bg-brand-600 hover:bg-brand-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Productos</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{products?.length || 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Compuestos (Recetas)</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-brand-600">{products?.filter(p => p.product_type === 'composite').length || 0}</div></CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Listado</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredProducts}
                            pageSize={10}
                            columns={[
                                {
                                    header: 'Nombre',
                                    accessor: (p) => (
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-gray-400">{p.unit_of_measure}</div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Tipo',
                                    accessor: (p) => p.product_type === 'composite'
                                        ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><ChefHat className="w-3 h-3 mr-1" /> Receta</span>
                                        : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Simple</span>
                                },
                                {
                                    header: 'Categoría',
                                    accessor: (p) => categories?.find(c => c.id === p.category_id)?.name || '-'
                                },
                                {
                                    header: 'Precio',
                                    accessor: (p) => formatCurrency(p.base_price),
                                    className: 'text-right font-mono'
                                },
                                {
                                    header: 'Acciones',
                                    accessor: (p) => (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}><Edit className="h-4 w-4 text-gray-500" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    ),
                                    className: 'text-right'
                                }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Main Dialog (Create/Edit) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0">
                    <div className="p-6 pb-4">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-0">
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Sandwich Mixto" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoría *</Label>
                                    <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio Venta *</Label>
                                    <Input type="number" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Costo (Ref)</Label>
                                    <Input type="number" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unidad</Label>
                                    <Select value={formData.unit_of_measure} onValueChange={v => setFormData({ ...formData, unit_of_measure: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UND">Unidad (UND)</SelectItem>
                                            <SelectItem value="KG">Kilos (KG)</SelectItem>
                                            <SelectItem value="L">Litros (L)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Producto</Label>
                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ptype"
                                            checked={formData.product_type === 'simple'}
                                            onChange={() => setFormData({ ...formData, product_type: 'simple' })}
                                            className="accent-brand-600"
                                        />
                                        <span className="font-medium">Producto Simple</span>
                                        <span className="text-xs text-gray-500">(Control directo de stock)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ptype"
                                            checked={formData.product_type === 'composite'}
                                            onChange={() => setFormData({ ...formData, product_type: 'composite' })}
                                            className="accent-brand-600"
                                        />
                                        <span className="font-medium">Producto Compuesto</span>
                                        <span className="text-xs text-gray-500">(Usa receta/ingredientes)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Recipe Builder Section */}
                            {formData.product_type === 'composite' && (
                                <div className="border rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ChefHat className="h-5 w-5 text-purple-600" />
                                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Constructor de Receta</h3>
                                    </div>

                                    {/* Add Ingredient Row */}
                                    <div className="flex gap-3 items-end bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                                        <div className="flex-1 space-y-1.5 relative">
                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</Label>

                                            {currentIngredientId ? (
                                                <div className="flex items-center justify-between border rounded-md px-3 py-2 h-10 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                                                            {products?.find(p => p.id === currentIngredientId)?.name}
                                                        </span>
                                                        <span className="text-xs text-purple-500 bg-purple-100 dark:bg-purple-800/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-700">
                                                            {products?.find(p => p.id === currentIngredientId)?.unit_of_measure}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setCurrentIngredientId('')}
                                                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                                    <Input
                                                        placeholder="Buscar insumo..."
                                                        className="pl-9 h-10"
                                                        value={ingredientSearchTerm}
                                                        onChange={(e) => {
                                                            setIngredientSearchTerm(e.target.value);
                                                            setIsIngredientSearchOpen(true);
                                                        }}
                                                        onFocus={() => setIsIngredientSearchOpen(true)}
                                                    />
                                                    {isIngredientSearchOpen && ingredientSearchTerm && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                                            {availableIngredients
                                                                .filter(p => p.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()))
                                                                .map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        className="px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-sm flex justify-between items-center transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
                                                                        onClick={() => {
                                                                            setCurrentIngredientId(p.id);
                                                                            setIngredientSearchTerm('');
                                                                            setIsIngredientSearchOpen(false);
                                                                        }}
                                                                    >
                                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                                                                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{p.unit_of_measure}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                            {availableIngredients.filter(p => p.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())).length === 0 && (
                                                                <div className="p-3 text-sm text-gray-500 text-center italic">No se encontraron insumos</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-28 space-y-1.5">
                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cant. <span className="text-purple-600">{currentIngredientId ? products?.find(p => p.id === currentIngredientId)?.unit_of_measure : ''}</span>
                                            </Label>
                                            <Input
                                                className="h-10 text-center font-mono"
                                                type="number"
                                                placeholder="1"
                                                value={currentIngredientQty}
                                                onChange={e => setCurrentIngredientQty(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            onClick={addIngredientToRecipe}
                                            disabled={!currentIngredientId}
                                            className="h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Agregar
                                        </Button>
                                    </div>

                                    {/* Ingredients List */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Ingredientes actuales ({recipeIngredients.length})</Label>
                                        {recipeIngredients.length === 0 ? (
                                            <div className="text-center py-4 text-sm text-gray-400 italic border-2 border-dashed rounded">
                                                No hay ingredientes agregados a esta receta
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {recipeIngredients.map((ing, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                                {idx + 1}
                                                            </div>
                                                            <span>{ing.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-mono font-medium">{ing.quantity} {ing.unit}</span>
                                                            <button onClick={() => removeIngredientFromRecipe(idx)} className="text-gray-400 hover:text-red-500">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>URL de Imagen</Label>
                                <Input
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {formData.image_url && (
                                    <div className="mt-2">
                                        <img
                                            src={formData.image_url}
                                            alt="Vista previa"
                                            className="w-32 h-32 object-cover rounded border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="p-6 pt-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700">
                                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
