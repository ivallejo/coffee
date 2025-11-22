import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Shift {
    id: string;
    cashier_id: string;
    start_time: string;
    end_time: string | null;
    start_cash: number;
    end_cash: number | null;
    expected_cash: number | null;
    notes: string | null;
}

// Get current active shift for the logged-in user
export function useCurrentShift() {
    return useQuery({
        queryKey: ['currentShift'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('cashier_id', user.id)
                .is('end_time', null)
                .order('start_time', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data as Shift | null;
        },
    });
}

// Get all shifts (for admin)
export function useShifts() {
    return useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .order('start_time', { ascending: false });

            if (error) throw error;
            return data as Shift[];
        },
    });
}

// Open a new shift
export function useOpenShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (startCash: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase
                .from('shifts')
                .insert({
                    cashier_id: user.id,
                    start_cash: startCash,
                    start_time: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentShift'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });
}

// Close current shift
export function useCloseShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shiftId, endCash, notes }: { shiftId: string; endCash: number; notes?: string }) => {
            // Get shift sales to calculate expected cash
            const { data: orders } = await supabase
                .from('orders')
                .select('total_amount, payment_method')
                .eq('shift_id', shiftId);

            const cashSales = orders?.filter(o => o.payment_method === 'cash')
                .reduce((acc, o) => acc + o.total_amount, 0) || 0;

            const { data: shift } = await supabase
                .from('shifts')
                .select('start_cash')
                .eq('id', shiftId)
                .single();

            const expectedCash = (shift?.start_cash || 0) + cashSales;

            const { data, error } = await supabase
                .from('shifts')
                .update({
                    end_time: new Date().toISOString(),
                    end_cash: endCash,
                    expected_cash: expectedCash,
                    notes: notes || null,
                })
                .eq('id', shiftId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentShift'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });
}
