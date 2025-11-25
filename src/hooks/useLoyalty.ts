import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LoyaltyCard {
    customer_id: string;
    points: number;
    total_visits: number;
    last_visit: string;
    phone?: string;
    customers?: {
        full_name: string;
        doc_number: string;
    };
}

// Get loyalty card by customer ID
export function useLoyaltyCard(customerId: string | null) {
    return useQuery({
        queryKey: ['loyaltyCard', customerId],
        queryFn: async () => {
            if (!customerId) return null;

            const { data, error } = await supabase
                .from('loyalty_cards')
                .select(`
                    *,
                    customers (
                        full_name,
                        doc_number
                    )
                `)
                .eq('customer_id', customerId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as LoyaltyCard | null;
        },
        enabled: !!customerId,
    });
}

// Get all loyalty cards (for admin)
export function useLoyaltyCards() {
    return useQuery({
        queryKey: ['loyaltyCards'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loyalty_cards')
                .select(`
                    *,
                    customers (
                        full_name,
                        doc_number
                    )
                `)
                .order('points', { ascending: false });

            if (error) throw error;
            return data as LoyaltyCard[];
        },
    });
}

// Redeem points for reward
export function useRedeemPoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ customerId, pointsToRedeem }: { customerId: string; pointsToRedeem: number }) => {
            const { data: card } = await supabase
                .from('loyalty_cards')
                .select('points')
                .eq('customer_id', customerId)
                .single();

            if (!card || card.points < pointsToRedeem) {
                throw new Error('Puntos insuficientes');
            }

            const { data, error } = await supabase
                .from('loyalty_cards')
                .update({
                    points: card.points - pointsToRedeem,
                })
                .eq('customer_id', customerId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyCard', data.customer_id] });
            queryClient.invalidateQueries({ queryKey: ['loyaltyCards'] });
        },
    });
}
