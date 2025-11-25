'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Category } from '@/types';

export default function CategoriesPage() {
    const { data: categories, isLoading, refetch } = useCategories();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image_url: '',
        sort_order: 0
    });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = categories?.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            image_url: '',
            sort_order: 0
        });
        setEditingCategory(null);
    };

    const handleSave = async () => {
        try {
            const categoryData = {
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                image_url: formData.image_url || null,
                sort_order: formData.sort_order
            };

            let error;
            if (editingCategory) {
                const { error: updateError } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('categories')
                    .insert(categoryData);
                error = insertError;
            }

            if (error) throw error;

            toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
            setIsDialogOpen(false);
            resetForm();
            refetch();
        } catch (error: any) {
            toast.error('Error saving category: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This might affect products linked to this category.')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Category deleted');
            refetch();
        } catch (error: any) {
            toast.error('Error deleting category: ' + error.message);
        }
    };

    const openEdit = (cat: Category) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            image_url: cat.image_url || '',
            sort_order: cat.sort_order || 0
        });
        setIsDialogOpen(true);
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Category Management</h1>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>



                <Card>
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 mb-4">
                            <Search className="h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        <DataTable
                            data={filteredCategories}
                            pageSize={10}
                            columns={[
                                { header: 'Name', accessor: (cat) => cat.name, className: 'font-medium' },
                                { header: 'Slug', accessor: (cat) => cat.slug },
                                { header: 'Sort Order', accessor: (cat) => cat.sort_order || 0 },
                                {
                                    header: 'Actions',
                                    accessor: (cat) => (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(cat.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ),
                                    className: 'text-right'
                                }
                            ]}
                        />
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Coffee" />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (Optional)</Label>
                                <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated-from-name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!formData.name}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
