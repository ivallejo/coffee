'use client';

import { useState } from 'react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types';
import { Loader2, Search, X, Package, Coffee } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export function ProductGrid() {
    const { data: categories, isLoading: loadingCategories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { data: products, isLoading: loadingProducts } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
    const addToCart = useCartStore((state) => state.addToCart);

    // Filter products by search term
    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loadingCategories) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Search Bar - Soft Purple Design */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#673de6]/60" />
                </div>
                <Input
                    type="text"
                    placeholder="Buscar productos por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-11 h-12 text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#673de6] dark:focus:border-[#673de6] focus:ring-2 focus:ring-[#673de6]/20 rounded-lg shadow-sm transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#673de6] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Category Pills - Purple on Selection */}
            <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`
                            flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                            ${selectedCategory === 'all'
                                ? 'bg-[#673de6] text-white shadow-lg shadow-[#673de6]/30'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#673de6] dark:hover:border-[#673de6]'
                            }
                        `}
                    >
                        <Coffee className="h-4 w-4" />
                        <span>Todos</span>
                    </button>
                    {categories?.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`
                                flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-2
                                ${selectedCategory === cat.id
                                    ? 'bg-[#673de6] text-white shadow-lg shadow-[#673de6]/30'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#673de6] dark:hover:border-[#673de6]'
                                }
                            `}
                        >
                            <Coffee className="h-4 w-4" />
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                {loadingProducts ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin h-8 w-8 text-[#673de6]" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="bg-[#673de6]/10 rounded-full p-6 mb-4">
                            <Search className="h-12 w-12 text-[#673de6]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            No se encontraron productos
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {searchTerm
                                ? `No hay productos que coincidan con "${searchTerm}"`
                                : 'No hay productos en esta categoría'
                            }
                        </p>
                        {searchTerm && (
                            <Button
                                onClick={() => setSearchTerm('')}
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-[#673de6] text-[#673de6] hover:bg-[#673de6] hover:text-white"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Limpiar búsqueda
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
    return (
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200" onClick={onAdd}>
            <CardHeader className="p-4 pb-2">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl mb-2 overflow-hidden">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-12 w-12" />
                        </div>
                    )}
                </div>
                <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-gray-800 dark:text-gray-200">
                    {product.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.base_price)}
                </p>
            </CardContent>
        </Card>
    );
}

