'use client';

import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useLoyaltyRules } from '@/hooks/useLoyaltyRules';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Gift, Star, Trophy, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LoyaltyPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { customers } = useCustomers();
    const { rules } = useLoyaltyRules();

    // Fetch all pending rewards
    const { data: allRewards, isLoading: rewardsLoading } = useQuery({
        queryKey: ['all-pending-rewards'],
        queryFn: async () => {
            const { data } = await supabase
                .from('customer_rewards')
                .select('*')
                .eq('status', 'pending');
            return data || [];
        }
    });

    if (!customers || rewardsLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    // Process data
    const customerStats = customers.map(customer => {
        const customerRewards = allRewards?.filter(r => r.customer_id === customer.id) || [];
        return {
            ...customer,
            pendingRewards: customerRewards.length,
            rewardsList: customerRewards
        };
    });

    const filteredCustomers = customerStats.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.doc_number?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
    );

    const totalPendingRewards = allRewards?.length || 0;
    const activeRulesCount = rules?.filter(r => r.is_active).length || 0;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Panel de Fidelidad</h1>
                        <p className="text-gray-500">Monitoreo de recompensas y clientes</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/loyalty">
                            <Button>
                                <Trophy className="mr-2 h-4 w-4" /> Configurar Reglas
                            </Button>
                        </Link>
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recompensas Pendientes</CardTitle>
                            <Gift className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPendingRewards}</div>
                            <p className="text-xs text-muted-foreground">Premios por canjear</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reglas Activas</CardTitle>
                            <Trophy className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeRulesCount}</div>
                            <p className="text-xs text-muted-foreground">Campañas en curso</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                            <Star className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{customers.length}</div>
                            <p className="text-xs text-muted-foreground">Registrados en base de datos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estado de Clientes</CardTitle>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nombre, DNI o teléfono..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredCustomers}
                            pageSize={15}
                            emptyMessage="No se encontraron clientes"
                            columns={[
                                {
                                    header: 'Cliente',
                                    accessor: (c: any) => (
                                        <div>
                                            <p className="font-medium">{c.full_name}</p>
                                            {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Documento',
                                    accessor: (c: any) => c.doc_number || '-'
                                },
                                {
                                    header: 'Recompensas Pendientes',
                                    accessor: (c: any) => (
                                        c.pendingRewards > 0 ? (
                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                                <Gift className="h-3 w-3 mr-1" />
                                                {c.pendingRewards}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )
                                    )
                                },
                                {
                                    header: 'Detalle Premios',
                                    accessor: (c: any) => (
                                        c.rewardsList.length > 0 ? (
                                            <div className="text-xs text-gray-500 max-w-[200px] truncate">
                                                {c.rewardsList.map((r: any) => r.reward_description).join(', ')}
                                            </div>
                                        ) : '-'
                                    )
                                }
                            ]}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
