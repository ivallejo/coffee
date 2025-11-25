import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface StoreSettings {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    tax_id: string | null;
    footer_message: string | null;
    logo_url: string | null;
    currency_symbol: string;
    qr_code_url: string | null;
    receipt_logo_url: string | null;
}

export const useStoreSettings = () => {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['store-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .single();

            if (error) throw error;
            return data as StoreSettings;
        }
    });

    const updateSettings = useMutation({
        mutationFn: async (newSettings: Partial<StoreSettings>) => {
            // Assuming there's only one row, we update based on the ID if present, or just the first one found
            // Ideally we use the ID from the fetched settings
            if (!settings?.id) throw new Error("No settings loaded to update");

            const { data, error } = await supabase
                .from('store_settings')
                .update(newSettings)
                .eq('id', settings.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            toast.success('Configuración actualizada correctamente');
        },
        onError: (error: any) => {
            toast.error('Error al actualizar configuración: ' + error.message);
        }
    });

    return {
        settings,
        isLoading,
        updateSettings
    };
};
