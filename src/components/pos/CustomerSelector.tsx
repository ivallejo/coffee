'use client';

import { useState, useEffect } from 'react';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Plus, Search, X, Check } from 'lucide-react';

export function CustomerSelector() {
    const { customers, loading, addCustomer } = useCustomers();
    const { customerId, setCustomer } = useCartStore();
    const [search, setSearch] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({
        full_name: '',
        doc_type: 'DNI',
        doc_number: '',
        email: '',
        phone: '',
        address: ''
    });

    const selectedCustomer = customers.find(c => c.id === customerId);

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.doc_number?.includes(search)
    ).slice(0, 5);

    const handleSelect = (customer: Customer) => {
        setCustomer(customer.id);
        setSearch('');
        setShowResults(false);
    };

    const handleClear = () => {
        setCustomer(null);
        setSearch('');
    };

    const handleCreateCustomer = async () => {
        if (!newCustomer.full_name) return;
        const created = await addCustomer(newCustomer);
        if (created) {
            setCustomer(created.id);
            setIsNewCustomerOpen(false);
            setNewCustomer({ full_name: '', doc_type: 'DNI', doc_number: '', email: '', phone: '', address: '' });
        }
    };

    return (
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
            {selectedCustomer ? (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{selectedCustomer.full_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{selectedCustomer.doc_type}: {selectedCustomer.doc_number || '-'}</span>
                                {selectedCustomer.loyalty_points !== undefined && (
                                    <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        ⭐ {selectedCustomer.loyalty_points} pts
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClear}>
                        <X className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar cliente (Nombre / DNI)..."
                            className="pl-9 pr-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            // Delay blur to allow clicks
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            onClick={() => setIsNewCustomerOpen(true)}
                            title="Crear Nuevo Cliente"
                        >
                            <Plus className="h-4 w-4 text-blue-600" />
                        </Button>
                    </div>

                    {showResults && search && (
                        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex justify-between items-center"
                                        onMouseDown={() => handleSelect(c)}
                                    >
                                        <div>
                                            <div className="font-medium">{c.full_name}</div>
                                            <div className="text-xs text-gray-500">{c.doc_number}</div>
                                        </div>
                                        <Check className="h-3 w-3 opacity-0" />
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-center"
                                    onMouseDown={() => setIsNewCustomerOpen(true)}
                                >
                                    + Crear "{search}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nombre Completo *</Label>
                            <Input
                                value={newCustomer.full_name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo Doc.</Label>
                                <Select
                                    value={newCustomer.doc_type}
                                    onValueChange={(v) => setNewCustomer({ ...newCustomer, doc_type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="RUC">RUC</SelectItem>
                                        <SelectItem value="CE">CE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Número Doc.</Label>
                                <Input
                                    value={newCustomer.doc_number}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, doc_number: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    placeholder="cliente@ejemplo.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    placeholder="999 888 777"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={newCustomer.address}
                                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                placeholder="Av. Principal 123"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateCustomer} disabled={!newCustomer.full_name}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
