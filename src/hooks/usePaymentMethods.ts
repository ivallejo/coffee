import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PaymentMethod {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    requires_reference: boolean;
    requires_details: boolean;
    sort_order: number;
}

export function usePaymentMethods() {
    const queryClient = useQueryClient();

    const { data: paymentMethods, isLoading, error } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data as PaymentMethod[];
        }
    });

    const togglePaymentMethod = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_active })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        }
    });

    return {
        paymentMethods,
        isLoading,
        error,
        togglePaymentMethod
    };
}
