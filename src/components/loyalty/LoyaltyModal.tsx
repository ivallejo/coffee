'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRedeemPoints } from '@/hooks/useLoyalty';
import { useCartStore } from '@/store/useCartStore';
import { useCustomers } from '@/hooks/useCustomers';
import { toast } from 'sonner';
import { Loader2, Gift, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoyaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoyaltyModal({ isOpen, onClose }: LoyaltyModalProps) {
    const { customerId } = useCartStore();
    const { customers } = useCustomers();
    const redeemPoints = useRedeemPoints();

    const selectedCustomer = customers.find(c => c.id === customerId);

    const POINTS_FOR_REWARD = 10;
    const currentPoints = selectedCustomer?.loyalty_points || 0;
    const availableRewards = Math.floor(currentPoints / POINTS_FOR_REWARD);
    const progressToNextReward = (currentPoints % POINTS_FOR_REWARD) / POINTS_FOR_REWARD * 100;

    const handleRedeemReward = async () => {
        if (!customerId || currentPoints < POINTS_FOR_REWARD) {
            toast.error('Puntos insuficientes para canjear');
            return;
        }

        try {
            await redeemPoints.mutateAsync({
                customerId,
                pointsToRedeem: POINTS_FOR_REWARD
            });

            toast.success('¡Recompensa canjeada! Café gratis aplicado');
            onClose();
        } catch (error: any) {
            toast.error('Error al canjear: ' + error.message);
        }
    };

    if (!selectedCustomer) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-purple-600" />
                            Programa de Fidelidad
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center text-gray-500">
                        <p>Selecciona un cliente para ver sus puntos de fidelidad</p>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                    {/* Loyalty Card Display */}
                    <div className="space-y-4">
                        {/* Card Header */}
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm opacity-90">Cliente VIP</p>
                                    <p className="text-lg font-bold">{selectedCustomer.full_name}</p>
                                    <p className="text-xs opacity-75">{selectedCustomer.doc_type}: {selectedCustomer.doc_number}</p>
                                </div>
                                <Award className="h-10 w-10 opacity-80" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-3xl font-bold">{currentPoints}</p>
                                    <p className="text-xs opacity-90">Puntos</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{availableRewards}</p>
                                    <p className="text-xs opacity-90">Cafés Gratis</p>
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
                                    {currentPoints % POINTS_FOR_REWARD}/{POINTS_FOR_REWARD}
                                </span>
                            </div>
                            <Progress value={progressToNextReward} className="h-2" />
                        </div>

                        {/* Available Rewards */}
                        {availableRewards > 0 && (
                            <div className="bg-[#673de6]/10 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-green-600" />
                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                        ¡{availableRewards} {availableRewards === 1 ? 'café gratis disponible' : 'cafés gratis disponibles'}!
                                    </p>
                                </div>
                                <Button
                                    onClick={handleRedeemReward}
                                    disabled={redeemPoints.isPending}
                                    className="w-full bg-[#673de6] hover:bg-[#5a2fcc]"
                                >
                                    {redeemPoints.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                                    Canjear Café Gratis
                                </Button>
                            </div>
                        )}

                        {availableRewards === 0 && (
                            <div className="text-center text-sm text-gray-500 py-4">
                                Sigue comprando para acumular más puntos
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
