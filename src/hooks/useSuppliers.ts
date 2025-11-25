import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Supplier {
    id: string;
    name: string;
    tax_id?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name');

            if (error) throw error;
            setSuppliers(data || []);
        } catch (error: any) {
            console.error('Error fetching suppliers:', error);
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    }, []);

    const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
        try {
            const { error } = await supabase.from('suppliers').insert(supplier);
            if (error) throw error;
            toast.success('Proveedor agregado');
            fetchSuppliers();
            return true;
        } catch (error: any) {
            toast.error(error.message);
            return false;
        }
    };

    const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
        try {
            const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
            if (error) throw error;
            toast.success('Proveedor actualizado');
            fetchSuppliers();
            return true;
        } catch (error: any) {
            toast.error(error.message);
            return false;
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            toast.success('Proveedor eliminado');
            fetchSuppliers();
            return true;
        } catch (error: any) {
            toast.error(error.message);
            return false;
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    return {
        suppliers,
        loading,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        refetch: fetchSuppliers
    };
}
