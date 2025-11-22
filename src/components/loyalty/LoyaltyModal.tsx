'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyCard, useUpsertLoyaltyCard, useRedeemPoints } from '@/hooks/useLoyalty';
import { toast } from 'sonner';
import { Loader2, Gift, Star, Phone, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoyaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDiscount?: (discountAmount: number) => void;
}

export function LoyaltyModal({ isOpen, onClose, onApplyDiscount }: LoyaltyModalProps) {
    const [phone, setPhone] = useState('');
    const [searchedPhone, setSearchedPhone] = useState<string | null>(null);
    const { data: loyaltyCard, isLoading, refetch } = useLoyaltyCard(searchedPhone);
    const upsertCard = useUpsertLoyaltyCard();
    const redeemPoints = useRedeemPoints();

    const POINTS_FOR_REWARD = 10;
    const availableRewards = Math.floor((loyaltyCard?.points || 0) / POINTS_FOR_REWARD);
    const progressToNextReward = ((loyaltyCard?.points || 0) % POINTS_FOR_REWARD) / POINTS_FOR_REWARD * 100;

    const handleSearch = async () => {
        if (!phone || phone.length < 8) {
            toast.error('Ingresa un número de teléfono válido');
            return;
        }
        setSearchedPhone(phone);
    };

    const handleCreateCard = async () => {
        if (!phone) return;

        try {
            await upsertCard.mutateAsync(phone);
            toast.success('Tarjeta de fidelidad creada');
            setSearchedPhone(phone);
            refetch();
        } catch (error: any) {
            toast.error('Error al crear tarjeta: ' + error.message);
        }
    };

    const handleRedeemReward = async () => {
        if (!searchedPhone || !loyaltyCard || loyaltyCard.points < POINTS_FOR_REWARD) {
            toast.error('Puntos insuficientes para canjear');
            return;
        }

        try {
            await redeemPoints.mutateAsync({
                phone: searchedPhone,
                pointsToRedeem: POINTS_FOR_REWARD
            });

            // Apply discount if callback provided
            if (onApplyDiscount) {
                // Assuming average coffee price is $3.50
                onApplyDiscount(3.50);
            }

            toast.success('¡Recompensa canjeada! Café gratis aplicado');
            refetch();
        } catch (error: any) {
            toast.error('Error al canjear: ' + error.message);
        }
    };

    const handleReset = () => {
        setPhone('');
        setSearchedPhone(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                handleReset();
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-600" />
                        Programa de Fidelidad
                    </DialogTitle>
                    <DialogDescription>
                        Acumula 10 cafés y obtén 1 gratis
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Phone Search */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Número de Teléfono</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Ej: 987654321"
                                    className="pl-10"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                            </Button>
                        </div>
                    </div>

                    {/* Card Not Found */}
                    {searchedPhone && !loyaltyCard && !isLoading && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Cliente nuevo. ¿Deseas crear una tarjeta de fidelidad?
                            </p>
                            <Button
                                onClick={handleCreateCard}
                                disabled={upsertCard.isPending}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                {upsertCard.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                                Crear Tarjeta de Fidelidad
                            </Button>
                        </div>
                    )}

                    {/* Loyalty Card Display */}
                    {loyaltyCard && (
                        <div className="space-y-4">
                            {/* Card Header */}
                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm opacity-90">Tarjeta de Fidelidad</p>
                                        <p className="text-lg font-bold">{loyaltyCard.phone}</p>
                                    </div>
                                    <Award className="h-10 w-10 opacity-80" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-3xl font-bold">{loyaltyCard.points}</p>
                                        <p className="text-xs opacity-90">Puntos</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{loyaltyCard.total_visits}</p>
                                        <p className="text-xs opacity-90">Visitas</p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress to Next Reward */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Progreso al próximo café gratis
                                    </span>
                                    <span className="font-semibold">
                                        {loyaltyCard.points % POINTS_FOR_REWARD}/{POINTS_FOR_REWARD}
                                    </span>
                                </div>
                                <Progress value={progressToNextReward} className="h-2" />
                            </div>

                            {/* Available Rewards */}
                            {availableRewards > 0 && (
                                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Gift className="h-5 w-5 text-green-600" />
                                        <p className="font-semibold text-green-800 dark:text-green-200">
                                            ¡{availableRewards} {availableRewards === 1 ? 'café gratis disponible' : 'cafés gratis disponibles'}!
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleRedeemReward}
                                        disabled={redeemPoints.isPending}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {redeemPoints.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                                        Canjear Café Gratis
                                    </Button>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="text-xs text-gray-500 text-center">
                                Última visita: {new Date(loyaltyCard.last_visit).toLocaleDateString('es-ES')}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                        handleReset();
                        onClose();
                    }}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
