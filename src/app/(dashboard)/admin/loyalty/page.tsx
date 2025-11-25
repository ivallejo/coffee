'use client';

import { useState } from 'react';
import { useLoyaltyRules } from '@/hooks/useLoyaltyRules';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Plus, Gift, Trash2, Edit, Trophy } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { LoyaltyRule } from '@/types';

export default function LoyaltyRulesPage() {
    const { rules, isLoading, createRule, updateRule, deleteRule } = useLoyaltyRules();
    const { data: products } = useProducts();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<LoyaltyRule | null>(null);

    const [formData, setFormData] = useState<Partial<LoyaltyRule>>({
        name: '',
        description: '',
        condition_type: 'transaction_amount',
        threshold: 0,
        reward_type: 'product',
        reward_product_id: null,
        reward_description: '',
        is_active: true
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            condition_type: 'transaction_amount',
            threshold: 0,
            reward_type: 'product',
            reward_product_id: null,
            reward_description: '',
            is_active: true
        });
        setEditingRule(null);
    };

    const handleOpenDialog = (rule?: LoyaltyRule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                name: rule.name,
                description: rule.description || '',
                condition_type: rule.condition_type,
                threshold: rule.threshold,
                reward_type: rule.reward_type,
                reward_product_id: rule.reward_product_id,
                reward_description: rule.reward_description,
                is_active: rule.is_active
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.threshold || !formData.reward_description) return;

        try {
            const ruleData = {
                name: formData.name,
                description: formData.description || null,
                condition_type: formData.condition_type as 'transaction_amount' | 'monthly_spend',
                threshold: Number(formData.threshold),
                reward_type: formData.reward_type as 'product' | 'custom',
                reward_product_id: formData.reward_type === 'product' && formData.reward_product_id ? formData.reward_product_id : null,
                reward_description: formData.reward_description,
                is_active: formData.is_active ?? true
            };

            if (editingRule) {
                await updateRule.mutateAsync({ id: editingRule.id, ...ruleData });
            } else {
                await createRule.mutateAsync(ruleData);
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            // Error handled in hook
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Programa de Fidelidad</h1>
                        <p className="text-gray-500">Configura reglas para premiar a tus clientes</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                        </Link>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Regla
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rules?.map((rule) => (
                        <Card key={rule.id} className={`relative overflow-hidden ${!rule.is_active ? 'opacity-60' : ''}`}>
                            <div className="absolute top-0 right-0 p-4">
                                <Switch
                                    checked={rule.is_active}
                                    onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 pr-12">
                                    <Trophy className={`h-5 w-5 ${rule.condition_type === 'monthly_spend' ? 'text-purple-500' : 'text-green-500'}`} />
                                    {rule.name}
                                </CardTitle>
                                <CardDescription>{rule.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Condición:</span>
                                        <span className="font-medium">
                                            {rule.condition_type === 'transaction_amount' ? 'Compra única >' : 'Gasto Mensual >'} {formatCurrency(rule.threshold)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Premio:</span>
                                        <span className="font-medium text-blue-600">{rule.reward_description}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(rule)}>
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => deleteRule.mutate(rule.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {rules?.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-dashed">
                            <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No hay reglas configuradas</p>
                            <p className="text-sm">Crea tu primera regla de fidelidad para premiar a tus clientes.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla de Fidelidad'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Regla</Label>
                            <Input
                                placeholder="Ej. Cliente VIP Mensual"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Condición</Label>
                                <Select
                                    value={formData.condition_type}
                                    onValueChange={(v) => setFormData({ ...formData, condition_type: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transaction_amount">Compra Única (Ticket)</SelectItem>
                                        <SelectItem value="monthly_spend">Acumulado Mensual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Monto Mínimo (S/)</Label>
                                <Input
                                    type="number"
                                    value={formData.threshold}
                                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <Gift className="h-4 w-4" /> Configuración del Premio
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Premio</Label>
                                    <Select
                                        value={formData.reward_type}
                                        onValueChange={(v) => setFormData({ ...formData, reward_type: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="product">Producto Gratis</SelectItem>
                                            <SelectItem value="custom">Personalizado (Merch, etc)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.reward_type === 'product' && (
                                    <div className="space-y-2">
                                        <Label>Producto a Regalar</Label>
                                        <Select
                                            value={formData.reward_product_id || ''}
                                            onValueChange={(v) => {
                                                const product = products?.find(p => p.id === v);
                                                setFormData({
                                                    ...formData,
                                                    reward_product_id: v,
                                                    reward_description: product ? `${product.name} Gratis` : ''
                                                });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar producto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products?.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción del Premio (Visible para el Cajero)</Label>
                                <Input
                                    placeholder="Ej. Capuccino Gratis"
                                    value={formData.reward_description}
                                    onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!formData.name || !formData.threshold || !formData.reward_description}>
                            Guardar Regla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
