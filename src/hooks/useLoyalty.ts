import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LoyaltyCard {
    phone: string;
    points: number;
    total_visits: number;
    last_visit: string;
}

// Get loyalty card by phone
export function useLoyaltyCard(phone: string | null) {
    return useQuery({
        queryKey: ['loyaltyCard', phone],
        queryFn: async () => {
            if (!phone) return null;

            const { data, error } = await supabase
                .from('loyalty_cards')
                .select('*')
                .eq('phone', phone)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data as LoyaltyCard | null;
        },
        enabled: !!phone,
    });
}

// Get all loyalty cards (for admin)
export function useLoyaltyCards() {
    return useQuery({
        queryKey: ['loyaltyCards'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loyalty_cards')
                .select('*')
                .order('points', { ascending: false });

            if (error) throw error;
            return data as LoyaltyCard[];
        },
    });
}

// Create or update loyalty card
export function useUpsertLoyaltyCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (phone: string) => {
            const { data, error } = await supabase
                .from('loyalty_cards')
                .upsert({
                    phone,
                    points: 0,
                    total_visits: 0,
                    last_visit: new Date().toISOString(),
                }, {
                    onConflict: 'phone',
                    ignoreDuplicates: false,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyCard', data.phone] });
            queryClient.invalidateQueries({ queryKey: ['loyaltyCards'] });
        },
    });
}

// Redeem points for reward
export function useRedeemPoints() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ phone, pointsToRedeem }: { phone: string; pointsToRedeem: number }) => {
            const { data: card } = await supabase
                .from('loyalty_cards')
                .select('points')
                .eq('phone', phone)
                .single();

            if (!card || card.points < pointsToRedeem) {
                throw new Error('Puntos insuficientes');
            }

            const { data, error } = await supabase
                .from('loyalty_cards')
                .update({
                    points: card.points - pointsToRedeem,
                })
                .eq('phone', phone)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyCard', data.phone] });
            queryClient.invalidateQueries({ queryKey: ['loyaltyCards'] });
        },
    });
}
