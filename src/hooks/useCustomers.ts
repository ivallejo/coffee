import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Customer {
    id: string;
    full_name: string;
    doc_type: string;
    doc_number: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    loyalty_points?: number; // Virtual field from join
}

export function useCustomers() {
    const queryClient = useQueryClient();

    const { data: customers = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    loyalty_cards (
                        points
                    )
                `)
                .order('full_name');

            if (error) {
                console.error('Error fetching customers:', error);
                toast.error('Error al cargar clientes');
                throw error;
            }

            // Debug: Ver estructura raw
            console.log('Raw customer data:', data?.[0]);
            console.log('Loyalty cards structure:', data?.[0]?.loyalty_cards);

            // Flatten the structure
            const formattedData = data?.map((c: any) => {
                // Intentar diferentes formas de acceder a los puntos
                let points = 0;

                if (c.loyalty_cards) {
                    if (Array.isArray(c.loyalty_cards) && c.loyalty_cards.length > 0) {
                        // Si es array, tomar el primer elemento
                        points = c.loyalty_cards[0]?.points ?? 0;
                    } else if (typeof c.loyalty_cards === 'object' && c.loyalty_cards.points !== undefined) {
                        // Si es objeto directo
                        points = c.loyalty_cards.points ?? 0;
                    }
                }

                console.log(`Customer ${c.full_name}: loyalty_cards =`, c.loyalty_cards, 'extracted points =', points);

                return {
                    ...c,
                    loyalty_points: points
                };
            }) || [];

            console.log('Formatted data:', formattedData);

            return formattedData as Customer[];
        },
    });

    const addCustomerMutation = useMutation({
        mutationFn: async (customer: Omit<Customer, 'id' | 'loyalty_points'>) => {
            const { data, error } = await supabase
                .from('customers')
                .insert(customer)
                .select()
                .single();

            if (error) {
                console.error('Error adding customer:', error);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente creado exitosamente');
        },
        onError: () => {
            toast.error('Error al crear cliente');
        },
    });

    return {
        customers,
        loading,
        refetch,
        addCustomer: addCustomerMutation.mutateAsync,
    };
}
