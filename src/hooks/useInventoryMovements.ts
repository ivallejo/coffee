import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface InventoryMovement {
    id: string;
    product_id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    reason: string;
    notes?: string;
    created_at: string;
    created_by: string;
    products?: {
        name: string;
    };
    profiles?: {
        full_name: string;
    };
}

interface FilterOptions {
    page?: number;
    pageSize?: number;
    startDate?: string | null;
    endDate?: string | null;
    productId?: string | 'all';
    userId?: string | 'all';
    type?: 'IN' | 'OUT' | 'all';
    reason?: string | 'all';
}

export function useInventoryMovements() {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Default filters
    const [filters, setFilters] = useState<FilterOptions>({
        page: 1,
        pageSize: 10,
        type: 'all',
        reason: 'all',
        productId: 'all',
        userId: 'all'
    });

    const fetchMovements = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('inventory_movements')
                .select(`
                    *,
                    products (name),
                    profiles (full_name)
                `, { count: 'exact' });

            // Apply Filters
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            if (filters.reason && filters.reason !== 'all') {
                query = query.eq('reason', filters.reason);
            }

            if (filters.productId && filters.productId !== 'all') {
                query = query.eq('product_id', filters.productId);
            }

            if (filters.userId && filters.userId !== 'all') {
                query = query.eq('created_by', filters.userId);
            }

            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }

            if (filters.endDate) {
                // Add one day to include the end date fully
                const end = new Date(filters.endDate);
                end.setDate(end.getDate() + 1);
                query = query.lt('created_at', end.toISOString());
            }

            // Pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 10;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            setMovements(data || []);
            setTotalCount(count || 0);
        } catch (error: any) {
            console.error('Error fetching movements:', error);
            toast.error('Error al cargar movimientos');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const addMovement = async (
        productId: string,
        type: 'IN' | 'OUT',
        quantity: number,
        reason: string,
        notes?: string
    ) => {
        // This function now acts as a wrapper for single item movements,
        // especially useful for 'OUT' movements or simple 'IN' without cost/supplier details.
        // For 'IN' movements with cost/supplier, registerPurchase should be called directly.
        return await registerPurchase([{ productId, quantity, cost: 0 }], type, reason, notes);
    };

    const registerPurchase = async (
        items: { productId: string; quantity: number; cost: number }[],
        type: 'IN' | 'OUT',
        reason: string,
        notes?: string,
        supplier?: string,
        referenceNumber?: string
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const movementsToInsert = items.map(item => ({
                product_id: item.productId,
                type,
                quantity: item.quantity,
                reason,
                notes,
                created_by: user.id,
                unit_cost: item.cost > 0 ? item.cost : null,
                supplier,
                reference_number: referenceNumber
            }));

            const { error } = await supabase
                .from('inventory_movements')
                .insert(movementsToInsert);

            if (error) throw error;

            toast.success('Movimientos registrados correctamente');
            fetchMovements();
            return true;
        } catch (error: any) {
            console.error('Error registering movements:', error);
            toast.error(error.message || 'Error al registrar movimientos');
            return false;
        }
    };

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const updateFilters = (newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
    };

    const setPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    return {
        movements,
        loading,
        totalCount,
        filters,
        updateFilters,
        setPage,
        addMovement,
        registerPurchase,
        refetch: fetchMovements
    };
}
