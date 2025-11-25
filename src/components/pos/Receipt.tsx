import React, { forwardRef } from 'react';
import { Order, CartItem } from '@/types';
import { StoreSettings } from '@/hooks/useStoreSettings';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

interface ReceiptProps {
    order: Order;
    items: CartItem[];
    settings: StoreSettings;
    cashierName?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, items, settings, cashierName }, ref) => {
    return (
        <div ref={ref} id="printable-receipt" className="bg-white text-black font-mono text-xs leading-tight w-[80mm]">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                    }
                }
            `}</style>

            <div className="p-2">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold mb-1 uppercase">{settings.name}</h1>
                    {settings.address && <p>{settings.address}</p>}
                    {settings.phone && <p>Tel: {settings.phone}</p>}
                    {settings.tax_id && <p>RUC/NIT: {settings.tax_id}</p>}
                </div>

                {/* Order Info */}
                <div className="mb-4 border-b border-dashed border-black pb-2">
                    <div className="flex justify-between">
                        <span>Orden:</span>
                        <span className="font-bold">#{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</span>
                    </div>
                    {cashierName && (
                        <div className="flex justify-between">
                            <span>Cajero:</span>
                            <span>{cashierName}</span>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="mb-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="pb-1 w-8">Cant</th>
                                <th className="pb-1">Prod</th>
                                <th className="text-right pb-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => {
                                const unitPrice = (item.manualPrice || (item.product.base_price + (item.variant?.price_adjustment || 0) + item.modifiers.reduce((s, m) => s + m.price, 0)));
                                return (
                                    <tr key={i}>
                                        <td className="py-1 align-top">{item.quantity}</td>
                                        <td className="py-1 align-top">
                                            <div className="font-semibold">{item.product.name}</div>
                                            {item.variant && <div className="text-[10px]">({item.variant.name})</div>}
                                            {item.modifiers.length > 0 && (
                                                <div className="text-[10px] italic">
                                                    + {item.modifiers.map(m => m.name).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-1 align-top text-right">
                                            {formatCurrency(unitPrice * item.quantity)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mb-4 border-t border-dashed border-black pt-2 space-y-1">
                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                        <span>Método de Pago:</span>
                        <span className="uppercase">{order.payment_method === 'cash' ? 'Efectivo' : order.payment_method === 'card' ? 'Tarjeta' : 'QR'}</span>
                    </div>
                    {order.payment_method === 'cash' && order.amount_paid > 0 && (
                        <>
                            <div className="flex justify-between text-[11px]">
                                <span>Pagado:</span>
                                <span>{formatCurrency(order.amount_paid)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span>Cambio:</span>
                                <span>{formatCurrency(order.change_returned)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-[10px]">
                    <p className="whitespace-pre-wrap">{settings.footer_message}</p>
                    <p className="mt-2 text-gray-400">.</p>
                </div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
