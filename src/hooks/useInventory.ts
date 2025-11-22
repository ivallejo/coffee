import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface InventoryItem {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    current_stock: number;
    unit: string;
    min_stock: number;
    max_stock: number;
    last_updated: string;
}

export const useInventory = () => {
    return useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory')
                .select(`
          *,
          ingredient:ingredients(name, unit)
        `)
                .order('ingredient_name', { ascending: true });

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                ingredient_id: item.ingredient_id,
                ingredient_name: item.ingredient?.name || 'Unknown',
                current_stock: item.current_stock,
                unit: item.ingredient?.unit || 'unit',
                min_stock: item.min_stock,
                max_stock: item.max_stock,
                last_updated: item.last_updated
            })) as InventoryItem[];
        },
    });
};
