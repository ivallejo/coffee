'use client';

import { useEffect, useState } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Save, Store, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDocumentSeries } from '@/hooks/useDocumentSeries';
import { ImageUpload } from '@/components/ui/image-upload';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
    const { settings, isLoading, updateSettings } = useStoreSettings();
    const { paymentMethods, togglePaymentMethod } = usePaymentMethods();
    const { documentSeries, updateSeries } = useDocumentSeries();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        tax_id: '',
        footer_message: '',
        currency_symbol: 'S/',
        qr_code_url: '',
        receipt_logo_url: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                name: settings.name || '',
                address: settings.address || '',
                phone: settings.phone || '',
                tax_id: settings.tax_id || '',
                footer_message: settings.footer_message || '',
                currency_symbol: settings.currency_symbol || 'S/',
                qr_code_url: settings.qr_code_url || '',
                receipt_logo_url: settings.receipt_logo_url || ''
            });
        }
    }, [settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettings.mutate(formData);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Configuración del Negocio</h1>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Datos Generales
                        </CardTitle>
                        <CardDescription>
                            Esta información aparecerá en los tickets de venta y reportes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-center mb-6">
                                <ImageUpload
                                    label="Logo del Recibo"
                                    currentImageUrl={formData.receipt_logo_url}
                                    onImageUploaded={(url) => setFormData({ ...formData, receipt_logo_url: url })}
                                    bucket="receipts"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Negocio *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">RUC / NIT / ID Fiscal</Label>
                                    <Input
                                        id="tax_id"
                                        value={formData.tax_id}
                                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                        placeholder="Ej. 20123456789"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono / Celular</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+51 999 999 999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Símbolo de Moneda</Label>
                                    <Input
                                        id="currency"
                                        value={formData.currency_symbol}
                                        onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                                        placeholder="S/"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección Física</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Av. Principal 123, Ciudad"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="footer">Mensaje al pie del ticket</Label>
                                <Textarea
                                    id="footer"
                                    value={formData.footer_message}
                                    onChange={(e) => setFormData({ ...formData, footer_message: e.target.value })}
                                    placeholder="¡Gracias por su compra! Vuelva pronto."
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Este mensaje se imprimirá al final de cada comprobante de venta.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="qr_code_url">URL para Código QR (Opcional)</Label>
                                <Input
                                    id="qr_code_url"
                                    name="qr_code_url"
                                    placeholder="https://wa.me/51999999999 o https://tusitio.com"
                                    value={formData.qr_code_url}
                                    onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL que se mostrará como código QR en los recibos (ej: WhatsApp, sitio web, redes sociales).
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={updateSettings.isPending}>
                                    {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Métodos de Pago
                        </CardTitle>
                        <CardDescription>
                            Activa o desactiva los métodos de pago disponibles en el POS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {paymentMethods?.map((method) => (
                                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">{method.name}</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {method.code === 'cash' ? 'Efectivo (Siempre activo)' :
                                                method.requires_reference ? 'Requiere número de operación' : 'Pago estándar'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={method.is_active}
                                        onCheckedChange={(checked) => togglePaymentMethod.mutate({ id: method.id, is_active: checked })}
                                        disabled={method.code === 'cash' || togglePaymentMethod.isPending}
                                    />
                                </div>
                            ))}
                            {!paymentMethods && <div className="text-center py-4 text-muted-foreground">Cargando métodos...</div>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Series de Documentos
                        </CardTitle>
                        <CardDescription>
                            Configura las series y correlativos para tickets, boletas y facturas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {documentSeries?.map((series) => (
                                <div key={series.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base font-medium capitalize">{series.document_type}</Label>
                                            {series.is_active && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Activo</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Serie: <strong>{series.series}</strong></span>
                                            <span>Correlativo actual: <strong>{String(series.current_number).padStart(8, '0')}</strong></span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Próximo: {series.series}-{String(series.current_number + 1).padStart(8, '0')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={series.is_active}
                                            onCheckedChange={(checked) => updateSeries.mutate({ id: series.id, is_active: checked })}
                                            disabled={updateSeries.isPending || series.document_type === 'ticket'}
                                        />
                                    </div>
                                </div>
                            ))}
                            {!documentSeries && <div className="text-center py-4 text-muted-foreground">Cargando series...</div>}
                            <p className="text-xs text-muted-foreground">
                                💡 El ticket siempre está activo. Boleta y Factura requieren configuración adicional.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
