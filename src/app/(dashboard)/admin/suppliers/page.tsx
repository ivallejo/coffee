'use client';

import { useState } from 'react';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ArrowLeft, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SuppliersPage() {
    const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [submitting, setSubmitting] = useState(false);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tax_id?.includes(searchTerm)
    );

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setSubmitting(true);
        let success = false;
        if (editingSupplier) {
            success = await updateSupplier(editingSupplier.id, formData);
        } else {
            success = await addSupplier(formData as any);
        }
        setSubmitting(false);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
            await deleteSupplier(id);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-4">
                <Link href="/admin" className="w-fit">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Dashboard
                    </Button>
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Proveedores</h1>
                        <p className="text-gray-500">Gestiona tu lista de proveedores</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="bg-[#673de6] hover:bg-[#5a2fcc]">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por nombre o RUC..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            data={filteredSuppliers}
                            pageSize={15}
                            emptyMessage="No se encontraron proveedores"
                            columns={[
                                {
                                    header: 'Nombre / Razón Social',
                                    accessor: (supplier) => supplier.name,
                                    className: 'font-medium'
                                },
                                {
                                    header: 'RUC / ID',
                                    accessor: (supplier) => supplier.tax_id || '-'
                                },
                                {
                                    header: 'Contacto',
                                    accessor: (supplier) => supplier.contact_name || '-'
                                },
                                {
                                    header: 'Teléfono',
                                    accessor: (supplier) => supplier.phone || '-'
                                },
                                {
                                    header: 'Acciones',
                                    accessor: (supplier) => (
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(supplier)}>
                                                <Pencil className="h-4 w-4 text-[#673de6]" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ),
                                    className: 'text-right'
                                }
                            ]}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre / Razón Social *</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>RUC / ID Fiscal</Label>
                                <Input
                                    value={formData.tax_id || ''}
                                    onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre de Contacto</Label>
                            <Input
                                value={formData.contact_name || ''}
                                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
