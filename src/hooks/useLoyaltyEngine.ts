import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useLoyaltyEngine = () => {

    const processLoyalty = async (customerId: string, currentOrderTotal: number) => {
        if (!customerId) return;

        try {
            console.log('Processing loyalty for customer:', customerId);

            // 1. Fetch active rules
            const { data: rules } = await supabase
                .from('loyalty_rules')
                .select('*')
                .eq('is_active', true);

            if (!rules || rules.length === 0) return;

            // 2. Fetch customer monthly spend (only if needed)
            const hasMonthlyRules = rules.some(r => r.condition_type === 'monthly_spend');
            let monthlySpend = 0;

            if (hasMonthlyRules) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // Fetch all orders from last 30 days
                // Note: This assumes the current order is ALREADY in the DB. 
                // If this runs before the order is committed, we might need to add currentOrderTotal manually.
                // But usually we run this after success.
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .eq('customer_id', customerId)
                    .gte('created_at', thirtyDaysAgo.toISOString());

                monthlySpend = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
                console.log('Monthly spend calculated:', monthlySpend);
            }

            // 3. Evaluate each rule
            const newRewards = [];

            for (const rule of rules) {
                let isEligible = false;

                if (rule.condition_type === 'transaction_amount') {
                    // Simple check: did this specific order cross the threshold?
                    if (currentOrderTotal >= rule.threshold) {
                        isEligible = true;
                    }
                } else if (rule.condition_type === 'monthly_spend') {
                    // Check if total spend meets threshold
                    if (monthlySpend >= rule.threshold) {
                        // CRITICAL: Check if reward was already granted in the last 30 days for this rule
                        // to prevent giving it every single time they buy something after crossing the line.
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                        const { count } = await supabase
                            .from('customer_rewards')
                            .select('*', { count: 'exact', head: true })
                            .eq('customer_id', customerId)
                            .eq('rule_id', rule.id)
                            .gte('created_at', thirtyDaysAgo.toISOString());

                        if ((count || 0) === 0) {
                            isEligible = true;
                        }
                    }
                }

                if (isEligible) {
                    newRewards.push({
                        customer_id: customerId,
                        rule_id: rule.id,
                        status: 'pending',
                        reward_description: rule.reward_description
                    });
                }
            }

            // 4. Save rewards
            if (newRewards.length > 0) {
                const { error } = await supabase
                    .from('customer_rewards')
                    .insert(newRewards);

                if (error) throw error;

                // Notify
                if (newRewards.length === 1) {
                    toast.success(`🎉 ¡Cliente ganó recompensa: ${newRewards[0].reward_description}!`);
                } else {
                    toast.success(`🎉 ¡Cliente ganó ${newRewards.length} recompensas!`);
                }
            }

        } catch (error) {
            console.error('Error processing loyalty:', error);
        }
    };

    return { processLoyalty };
};
