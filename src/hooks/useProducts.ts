import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';

export const useProducts = (categoryId?: string) => {
    return useQuery({
        queryKey: ['products', categoryId],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select(`
          *,
          variants (*)
        `)
                .eq('is_available', true);

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Product[];
        },
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('sort_order');

            if (error) throw error;
            return data as Category[];
        },
    });
};
