'use client';

import { useState } from 'react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, Search, Loader2, Users as UsersIcon, Trophy, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
    const { customers, loading, addCustomer, updateCustomer } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Customer>>({
        doc_type: 'DNI',
        first_name: '',
        last_name_father: '',
        last_name_mother: '',
        full_name: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.doc_number?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const handleOpenModal = (customer?: Customer) => {
        if (customer) {
            setEditingId(customer.id);
            setFormData({
                ...customer,
                first_name: customer.first_name || '',
                last_name_father: customer.last_name_father || '',
                last_name_mother: customer.last_name_mother || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                doc_type: 'DNI',
                first_name: '',
                last_name_father: '',
                last_name_mother: '',
                full_name: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = formData.full_name || `${formData.first_name} ${formData.last_name_father} ${formData.last_name_mother}`.trim();
        if (!fullName) return;

        setSubmitting(true);
        try {
            const dataToSave = { ...formData, full_name: fullName };

            if (editingId) {
                await updateCustomer({ id: editingId, ...dataToSave });
            } else {
                await addCustomer(dataToSave as any);
            }
            setIsModalOpen(false);
            setFormData({ doc_type: 'DNI' });
            setEditingId(null);
        } catch (error) {
            console.error('Error saving customer:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Stats
    const totalCustomers = customers.length;
    const customersWithLoyalty = customers.filter(c => (c.loyalty_points || 0) > 0).length;
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);

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
                        <h1 className="text-3xl font-bold">Clientes</h1>
                        <p className="text-gray-500">Gestiona tu base de clientes</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="bg-[#673de6] hover:bg-[#5a2fcc]">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            Total Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Con Puntos de Fidelidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customersWithLoyalty}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Puntos Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#673de6]">{totalPoints.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por nombre, documento, email o teléfono..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#673de6]" />
                        </div>
                    ) : (
                        <DataTable
                            data={filteredCustomers}
                            pageSize={15}
                            emptyMessage="No se encontraron clientes"
                            columns={[
                                {
                                    header: 'Nombre Completo',
                                    accessor: (customer) => customer.full_name,
                                    className: 'font-medium'
                                },
                                {
                                    header: 'Documento',
                                    accessor: (customer) => (
                                        <div>
                                            <div className="text-sm">{customer.doc_type}</div>
                                            <div className="text-xs text-gray-500">{customer.doc_number || '-'}</div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Contacto',
                                    accessor: (customer) => (
                                        <div>
                                            {customer.email && <div className="text-sm">{customer.email}</div>}
                                            {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                                            {!customer.email && !customer.phone && '-'}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Puntos de Fidelidad',
                                    accessor: (customer) => {
                                        const points = customer.loyalty_points || 0;
                                        return (
                                            <div className="flex items-center gap-2">
                                                {points > 0 ? (
                                                    <Badge className="bg-[#673de6]/10 text-[#673de6] hover:bg-[#673de6]/20 border-[#673de6]/30">
                                                        <Trophy className="h-3 w-3 mr-1" />
                                                        {points} pts
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">0 pts</span>
                                                )}
                                            </div>
                                        );
                                    },
                                    className: 'text-center'
                                },
                                {
                                    header: 'Acciones',
                                    accessor: (customer) => (
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(customer)}>
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    ),
                                    className: 'w-[50px] text-center'
                                }
                            ]}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Nombres</Label>
                                <Input
                                    value={formData.first_name || ''}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value, full_name: `${e.target.value} ${formData.last_name_father || ''} ${formData.last_name_mother || ''}`.trim() })}
                                    placeholder="Nombres del cliente"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Apellido Paterno</Label>
                                    <Input
                                        value={formData.last_name_father || ''}
                                        onChange={(e) => setFormData({ ...formData, last_name_father: e.target.value, full_name: `${formData.first_name || ''} ${e.target.value} ${formData.last_name_mother || ''}`.trim() })}
                                        placeholder="Apellido Paterno"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellido Materno</Label>
                                    <Input
                                        value={formData.last_name_mother || ''}
                                        onChange={(e) => setFormData({ ...formData, last_name_mother: e.target.value, full_name: `${formData.first_name || ''} ${formData.last_name_father || ''} ${e.target.value}`.trim() })}
                                        placeholder="Apellido Materno"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Documento *</Label>
                                <Select
                                    value={formData.doc_type || 'DNI'}
                                    onValueChange={val => setFormData({ ...formData, doc_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="RUC">RUC</SelectItem>
                                        <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                                        <SelectItem value="PAS">Pasaporte</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Número de Documento</Label>
                                <Input
                                    value={formData.doc_number || ''}
                                    onChange={e => setFormData({ ...formData, doc_number: e.target.value })}
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="cliente@ejemplo.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="999 888 777"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Av. Principal 123"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-[#673de6] hover:bg-[#5a2fcc]">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Guardar Cambios' : 'Crear Cliente'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
