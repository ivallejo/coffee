import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LoyaltyRule } from '@/types';
import { toast } from 'sonner';

export const useLoyaltyRules = () => {
    const queryClient = useQueryClient();

    const { data: rules, isLoading } = useQuery({
        queryKey: ['loyalty-rules'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loyalty_rules')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as LoyaltyRule[];
        }
    });

    const createRule = useMutation({
        mutationFn: async (newRule: Omit<LoyaltyRule, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('loyalty_rules')
                .insert(newRule)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty-rules'] });
            toast.success('Regla creada correctamente');
        },
        onError: (error: any) => {
            toast.error('Error al crear regla: ' + error.message);
        }
    });

    const updateRule = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<LoyaltyRule> & { id: string }) => {
            const { data, error } = await supabase
                .from('loyalty_rules')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty-rules'] });
            toast.success('Regla actualizada correctamente');
        },
        onError: (error: any) => {
            toast.error('Error al actualizar regla: ' + error.message);
        }
    });

    const deleteRule = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('loyalty_rules')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty-rules'] });
            toast.success('Regla eliminada correctamente');
        },
        onError: (error: any) => {
            toast.error('Error al eliminar regla: ' + error.message);
        }
    });

    return {
        rules,
        isLoading,
        createRule,
        updateRule,
        deleteRule
    };
};
