import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OrderItemWithProduct {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products?: {
        id: string;
        name: string;
        category_id: string;
        categories?: {
            id: string;
            name: string;
        };
    };
}

export const useOrderItems = () => {
    return useQuery({
        queryKey: ['order-items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('order_items')
                .select('*');

            if (error) throw error;
            return data as OrderItemWithProduct[];
        },
    });
};
