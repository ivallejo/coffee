'use client';

import { useState } from 'react';
import { useLoyaltyCards } from '@/hooks/useLoyalty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Gift, Star, Trophy, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LoyaltyPage() {
    const { data: loyaltyCards, isLoading } = useLoyaltyCards();
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    const filteredCards = loyaltyCards?.filter(card =>
        card.phone.includes(searchTerm)
    ) || [];

    const totalCustomers = loyaltyCards?.length || 0;
    const totalPoints = loyaltyCards?.reduce((acc, card) => acc + card.points, 0) || 0;
    const totalVisits = loyaltyCards?.reduce((acc, card) => acc + card.total_visits, 0) || 0;
    const topCustomers = [...(loyaltyCards || [])].sort((a, b) => b.points - a.points).slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Programa de Fidelidad</h1>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCustomers}</div>
                            <p className="text-xs text-muted-foreground">Registrados en el programa</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalPoints}</div>
                            <p className="text-xs text-muted-foreground">Acumulados por todos los clientes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalVisits}</div>
                            <p className="text-xs text-muted-foreground">Compras realizadas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            Top 5 Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topCustomers.map((card, index) => (
                                <div key={card.phone} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                    index === 2 ? 'bg-orange-600 text-white' :
                                                        'bg-gray-300 text-gray-700'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{card.phone}</p>
                                            <p className="text-xs text-gray-500">{card.total_visits} visitas</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        {card.points} puntos
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* All Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Todos los Clientes</CardTitle>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por teléfono..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Puntos</TableHead>
                                    <TableHead>Cafés Gratis Disponibles</TableHead>
                                    <TableHead>Total Visitas</TableHead>
                                    <TableHead>Última Visita</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCards.map((card) => {
                                    const availableRewards = Math.floor(card.points / 10);
                                    return (
                                        <TableRow key={card.phone}>
                                            <TableCell className="font-medium">{card.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                                    {card.points}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {availableRewards > 0 ? (
                                                    <Badge variant="default" className="bg-green-600">
                                                        <Gift className="h-3 w-3 mr-1" />
                                                        {availableRewards}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{card.total_visits}</TableCell>
                                            <TableCell>
                                                {format(new Date(card.last_visit), "dd MMM yyyy", { locale: es })}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredCards.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                            No se encontraron clientes
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
