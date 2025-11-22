'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, AlertTriangle, Package, Edit } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { InventoryItem } from '@/hooks/useInventory';

export default function InventoryPage() {
    const { data: inventory, isLoading, refetch } = useInventory();
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [newStock, setNewStock] = useState('');

    const lowStockItems = inventory?.filter(item => item.current_stock <= item.min_stock) || [];

    const handleUpdateStock = async () => {
        if (!editingItem) return;

        try {
            const { error } = await supabase
                .from('inventory')
                .update({
                    current_stock: parseFloat(newStock),
                    last_updated: new Date().toISOString()
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            toast.success('Stock updated successfully');
            setEditingItem(null);
            setNewStock('');
            refetch();
        } catch (error: any) {
            toast.error('Failed to update stock: ' + error.message);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Inventory Management</h1>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inventory?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">Ingredients tracked</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{lowStockItems.length}</div>
                            <p className="text-xs text-muted-foreground">Items need restocking</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Low Stock Alerts */}
                {lowStockItems.length > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                        <CardHeader>
                            <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                Low Stock Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {lowStockItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 rounded">
                                        <span className="font-medium">{item.ingredient_name}</span>
                                        <span className="text-red-600 font-bold">
                                            {item.current_stock} {item.unit} (Min: {item.min_stock})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Inventory Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingredient</TableHead>
                                    <TableHead className="text-right">Current Stock</TableHead>
                                    <TableHead className="text-right">Min Stock</TableHead>
                                    <TableHead className="text-right">Max Stock</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory?.map((item) => {
                                    const isLow = item.current_stock <= item.min_stock;
                                    const percentage = (item.current_stock / item.max_stock) * 100;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.ingredient_name}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={isLow ? 'text-red-600 font-bold' : ''}>
                                                    {item.current_stock} {item.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{item.min_stock} {item.unit}</TableCell>
                                            <TableCell className="text-right">{item.max_stock} {item.unit}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${isLow ? 'bg-red-500' : percentage > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setNewStock(item.current_stock.toString());
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Stock Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Stock - {editingItem?.ingredient_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock">Current Stock ({editingItem?.unit})</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                placeholder="Enter new stock amount"
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            <p>Min: {editingItem?.min_stock} {editingItem?.unit}</p>
                            <p>Max: {editingItem?.max_stock} {editingItem?.unit}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                        <Button onClick={handleUpdateStock}>Update Stock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
