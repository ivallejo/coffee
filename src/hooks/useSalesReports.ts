import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

export type DateRange = {
    from: Date;
    to: Date;
};

export type SalesData = {
    total: number;
    count: number;
    byPaymentMethod: { method: string; total: number; count: number }[];
};

export type EmployeeSales = {
    employee_id: string;
    employee_name: string;
    total_sales: number;
    sales_count: number;
    total_discount: number;
};

export type ProductSales = {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    total_revenue: number;
};

export type CustomerSales = {
    customer_id: string | null;
    customer_name: string;
    total_purchases: number;
    purchase_count: number;
    products_count: number;
};

export function useSalesReports(dateRange: DateRange) {
    // Sales Overview
    const { data: salesOverview, isLoading: loadingSalesOverview } = useQuery({
        queryKey: ['salesOverview', dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('total_amount, payment_method, created_at')
                .eq('status', 'completed')
                .gte('created_at', dateRange.from.toISOString())
                .lte('created_at', dateRange.to.toISOString());

            if (error) throw error;

            const total = data.reduce((sum, order) => sum + order.total_amount, 0);
            const count = data.length;

            // Group by payment method
            const byPaymentMethod = data.reduce((acc: any[], order) => {
                const existing = acc.find(item => item.method === order.payment_method);
                if (existing) {
                    existing.total += order.total_amount;
                    existing.count += 1;
                } else {
                    acc.push({
                        method: order.payment_method,
                        total: order.total_amount,
                        count: 1
                    });
                }
                return acc;
            }, []);

            return { total, count, byPaymentMethod } as SalesData;
        }
    });

    // Sales by Employee
    const { data: employeeSales, isLoading: loadingEmployeeSales } = useQuery({
        queryKey: ['employeeSales', dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    total_amount,
                    cashier_id,
                    profiles!orders_cashier_id_fkey(full_name)
                `)
                .eq('status', 'completed')
                .gte('created_at', dateRange.from.toISOString())
                .lte('created_at', dateRange.to.toISOString());

            if (error) throw error;

            const grouped = data.reduce((acc: any[], order: any) => {
                const existing = acc.find(item => item.employee_id === order.cashier_id);
                if (existing) {
                    existing.total_sales += order.total_amount;
                    existing.sales_count += 1;
                } else {
                    acc.push({
                        employee_id: order.cashier_id,
                        employee_name: order.profiles?.full_name || 'Desconocido',
                        total_sales: order.total_amount,
                        sales_count: 1,
                        total_discount: 0
                    });
                }
                return acc;
            }, []);

            return grouped.sort((a, b) => b.total_sales - a.total_sales) as EmployeeSales[];
        }
    });

    // Sales by Product
    const { data: productSales, isLoading: loadingProductSales } = useQuery({
        queryKey: ['productSales', dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    product_id,
                    product_name,
                    quantity,
                    total_price,
                    orders!inner(created_at, status)
                `)
                .eq('orders.status', 'completed')
                .gte('orders.created_at', dateRange.from.toISOString())
                .lte('orders.created_at', dateRange.to.toISOString());

            if (error) throw error;

            const grouped = data.reduce((acc: any[], item: any) => {
                const existing = acc.find(p => p.product_id === item.product_id);
                if (existing) {
                    existing.quantity_sold += item.quantity;
                    existing.total_revenue += item.total_price;
                } else {
                    acc.push({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity_sold: item.quantity,
                        total_revenue: item.total_price
                    });
                }
                return acc;
            }, []);

            return grouped.sort((a, b) => b.total_revenue - a.total_revenue) as ProductSales[];
        }
    });

    // Sales by Customer
    const { data: customerSales, isLoading: loadingCustomerSales } = useQuery({
        queryKey: ['customerSales', dateRange],
        queryFn: async () => {
            // First, get all orders with customer info
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    id,
                    total_amount,
                    customer_id,
                    customers(full_name)
                `)
                .eq('status', 'completed')
                .gte('created_at', dateRange.from.toISOString())
                .lte('created_at', dateRange.to.toISOString());

            if (ordersError) throw ordersError;

            // Get all order items for these orders
            const orderIds = orders.map(o => o.id);

            let orderItemsData: any[] = [];
            if (orderIds.length > 0) {
                const { data: items, error: itemsError } = await supabase
                    .from('order_items')
                    .select('order_id, quantity')
                    .in('order_id', orderIds);

                if (itemsError) throw itemsError;
                orderItemsData = items || [];
            }

            // Create a map of order_id to total quantity
            const orderQuantities = orderItemsData.reduce((acc: any, item) => {
                if (!acc[item.order_id]) {
                    acc[item.order_id] = 0;
                }
                acc[item.order_id] += item.quantity;
                return acc;
            }, {});

            // Group by customer
            const grouped = orders.reduce((acc: any[], order: any) => {
                const customerId = order.customer_id || 'sin-registro';
                const customerName = order.customers?.full_name || 'Sin registro';

                const existing = acc.find(c => c.customer_id === customerId);
                const productsCount = orderQuantities[order.id] || 0;

                if (existing) {
                    existing.total_purchases += order.total_amount;
                    existing.purchase_count += 1;
                    existing.products_count += productsCount;
                } else {
                    acc.push({
                        customer_id: customerId,
                        customer_name: customerName,
                        total_purchases: order.total_amount,
                        purchase_count: 1,
                        products_count: productsCount
                    });
                }
                return acc;
            }, []);

            return grouped.sort((a, b) => b.total_purchases - a.total_purchases).slice(0, 5) as CustomerSales[];
        }
    });

    return {
        salesOverview,
        employeeSales,
        productSales,
        customerSales,
        isLoading: loadingSalesOverview || loadingEmployeeSales || loadingProductSales || loadingCustomerSales
    };
}

// Helper to get predefined date ranges
export function getDateRangePreset(preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth'): DateRange {
    const now = new Date();

    switch (preset) {
        case 'today':
            return { from: startOfDay(now), to: endOfDay(now) };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
        case 'last7days':
            return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
        case 'last30days':
            return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
        case 'thisMonth':
            return { from: startOfMonth(now), to: endOfMonth(now) };
        default:
            return { from: startOfDay(now), to: endOfDay(now) };
    }
}
