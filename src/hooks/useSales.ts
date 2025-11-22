import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';

export const useSales = () => {
    return useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          cashier:profiles(full_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as (Order & { cashier: { full_name: string } })[];
        },
    });
};
