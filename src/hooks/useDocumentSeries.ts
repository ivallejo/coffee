import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DocumentSeries {
    id: string;
    document_type: 'ticket' | 'boleta' | 'factura';
    series: string;
    current_number: number;
    is_active: boolean;
}

export function useDocumentSeries() {
    const queryClient = useQueryClient();

    const { data: documentSeries, isLoading } = useQuery({
        queryKey: ['documentSeries'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('document_series')
                .select('*')
                .order('document_type', { ascending: true })
                .order('series', { ascending: true });

            if (error) throw error;
            return data as DocumentSeries[];
        }
    });

    const updateSeries = useMutation({
        mutationFn: async ({ id, is_active, series }: { id: string; is_active?: boolean; series?: string }) => {
            const updateData: any = {};
            if (is_active !== undefined) updateData.is_active = is_active;
            if (series !== undefined) updateData.series = series;

            const { error } = await supabase
                .from('document_series')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentSeries'] });
        }
    });

    const createSeries = useMutation({
        mutationFn: async (newSeries: { document_type: string; series: string }) => {
            const { error } = await supabase
                .from('document_series')
                .insert(newSeries);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentSeries'] });
        }
    });

    // Get active series for a document type
    const getActiveSeries = (documentType: 'ticket' | 'boleta' | 'factura') => {
        return documentSeries?.find(s => s.document_type === documentType && s.is_active);
    };

    return {
        documentSeries,
        isLoading,
        updateSeries,
        createSeries,
        getActiveSeries
    };
}

// Function to get next document number (calls the database function)
export async function getNextDocumentNumber(documentType: 'ticket' | 'boleta' | 'factura', series?: string) {
    const { data, error } = await supabase.rpc('get_next_document_number', {
        p_document_type: documentType,
        p_series: series || null
    });

    if (error) throw error;
    return data[0] as { series: string; number: number; full_number: string };
}
