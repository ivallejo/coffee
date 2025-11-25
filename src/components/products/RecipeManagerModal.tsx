'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ChefHat, Loader2 } from 'lucide-react';
import { useProductRecipe } from '@/hooks/useProductRecipe';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RecipeManagerModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export function RecipeManagerModal({ product, isOpen, onClose }: RecipeManagerModalProps) {
    const { recipe, isLoading: loadingRecipe, addIngredient, removeIngredient } = useProductRecipe(product?.id || null);
    const { data: allProducts } = useProducts();

    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('1');

    if (!product) return null;

    // Filter available ingredients: exclude self and already added ingredients
    const availableIngredients = allProducts?.filter(p =>
        p.id !== product.id &&
        !recipe?.some((r: any) => r.ingredient_product_id === p.id)
    ) || [];

    const handleAdd = () => {
        if (!selectedIngredientId || !quantity) return;
        addIngredient.mutate({
            ingredientId: selectedIngredientId,
            quantity: parseFloat(quantity)
        });
        setSelectedIngredientId('');
        setQuantity('1');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-orange-500" />
                        Receta: {product.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add Ingredient Form */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4 border border-dashed border-gray-300 dark:border-gray-700">
                        <h4 className="text-sm font-medium">Agregar Ingrediente</h4>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Producto / Insumo</Label>
                                <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar insumo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableIngredients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} ({p.unit_of_measure || 'UND'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-24 space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAdd} disabled={!selectedIngredientId || addIngredient.isPending}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Ingredients List */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingrediente</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingRecipe ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : recipe?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                            No hay ingredientes en esta receta
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recipe?.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.ingredient_product?.name}</TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity} {item.ingredient_product?.unit_of_measure}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => removeIngredient.mutate(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
