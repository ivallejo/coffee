import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CustomerReward } from '@/types';
import { toast } from 'sonner';

export const useCustomerRewards = (customerId: string | null) => {
    const queryClient = useQueryClient();

    const { data: rewards, isLoading } = useQuery({
        queryKey: ['customer-rewards', customerId],
        queryFn: async () => {
            if (!customerId) return [];

            const { data, error } = await supabase
                .from('customer_rewards')
                .select(`
                    *,
                    loyalty_rules (
                        reward_type,
                        reward_product_id
                    )
                `)
                .eq('customer_id', customerId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as (CustomerReward & { loyalty_rules: { reward_type: string, reward_product_id: string | null } })[];
        },
        enabled: !!customerId
    });

    const redeemReward = useMutation({
        mutationFn: async (rewardId: string) => {
            const { error } = await supabase
                .from('customer_rewards')
                .update({
                    status: 'redeemed',
                    redeemed_at: new Date().toISOString()
                })
                .eq('id', rewardId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-rewards'] });
            toast.success('Recompensa canjeada correctamente');
        },
        onError: (error: any) => {
            toast.error('Error al canjear recompensa: ' + error.message);
        }
    });

    return {
        rewards,
        isLoading,
        redeemReward
    };
};
