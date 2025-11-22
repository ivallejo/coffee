'use client';

import { useState } from 'react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types';
import { Loader2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export function ProductGrid() {
    const { data: categories, isLoading: loadingCategories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { data: products, isLoading: loadingProducts } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
    const addToCart = useCartStore((state) => state.addToCart);

    if (loadingCategories) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="all" className="w-full flex-none" onValueChange={setSelectedCategory}>
                <div className="overflow-x-auto pb-4">
                    <TabsList>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        {categories?.map((cat) => (
                            <TabsTrigger key={cat.id} value={cat.id}>
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </Tabs>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                {loadingProducts ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {products?.map((product) => (
                            <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onAdd}>
            <CardHeader className="p-4 pb-2">
                <div className="aspect-square bg-gray-200 rounded-md mb-2 overflow-hidden">
                    {/* Placeholder for image */}
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Sin Imagen</div>
                    )}
                </div>
                <CardTitle className="text-sm font-medium leading-tight">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-2">
                <p className="text-lg font-bold">{formatCurrency(product.base_price)}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button size="sm" className="w-full" variant="secondary">
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
            </CardFooter>
        </Card>
    );
}
