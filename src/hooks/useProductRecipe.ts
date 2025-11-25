import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProductRecipe } from '@/types';
import { toast } from 'sonner';

export const useProductRecipe = (parentProductId: string | null) => {
    const queryClient = useQueryClient();

    const { data: recipe, isLoading } = useQuery({
        queryKey: ['product-recipe', parentProductId],
        queryFn: async () => {
            if (!parentProductId) return [];
            const { data, error } = await supabase
                .from('product_recipes')
                .select('*, ingredient_product:ingredient_product_id(*)') // Correct relation syntax might vary, assuming FK is set
                .eq('parent_product_id', parentProductId);

            if (error) throw error;
            // Map the nested product data correctly if needed, Supabase returns it as object
            return data as any[];
        },
        enabled: !!parentProductId
    });

    const addIngredient = useMutation({
        mutationFn: async ({ ingredientId, quantity }: { ingredientId: string, quantity: number }) => {
            if (!parentProductId) throw new Error('No parent product');
            const { error } = await supabase
                .from('product_recipes')
                .insert({
                    parent_product_id: parentProductId,
                    ingredient_product_id: ingredientId,
                    quantity
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-recipe', parentProductId] });
            toast.success('Ingrediente agregado');
        },
        onError: (err: any) => toast.error(err.message)
    });

    const removeIngredient = useMutation({
        mutationFn: async (recipeId: string) => {
            const { error } = await supabase
                .from('product_recipes')
                .delete()
                .eq('id', recipeId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-recipe', parentProductId] });
            toast.success('Ingrediente eliminado');
        }
    });

    return { recipe, isLoading, addIngredient, removeIngredient };
};
