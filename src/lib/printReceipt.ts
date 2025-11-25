import { Order, CartItem } from '@/types';
import { StoreSettings } from '@/hooks/useStoreSettings';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

export const printReceipt = (order: Order, items: CartItem[], settings: StoreSettings, cashierName?: string) => {
    // Remove existing print iframes
    const existingIframe = document.getElementById('receipt-print-iframe');
    if (existingIframe) {
        document.body.removeChild(existingIframe);
    }

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Generate HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket #${order.id.slice(0, 8)}</title>
            <style>
                @page { margin: 0; size: auto; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 11px;
                    width: 72mm;
                    margin: 0 auto;
                    padding: 10px;
                    color: black;
                    background: white;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .border-b { border-bottom: 1px dashed black; padding-bottom: 0.5rem; }
                .border-t { border-top: 1px dashed black; padding-top: 0.5rem; }
                .border-double { border-top: 3px double black; border-bottom: 3px double black; padding: 0.5rem 0; }
                table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
                th { text-align: left; font-size: 10px; padding-bottom: 0.25rem; border-bottom: 1px solid black; }
                td { vertical-align: top; padding: 0.25rem 0; font-size: 10px; }
                .text-xs { font-size: 9px; }
                .text-lg { font-size: 13px; }
                .text-xl { font-size: 16px; }
                .text-2xl { font-size: 18px; }
                .uppercase { text-transform: uppercase; }
                .doc-type {
                    padding: 0.5rem;
                    margin: 0.5rem 0;
                    font-weight: bold;
                    font-size: 12px;
                }
                .total-section {
                    padding: 0.5rem;
                    margin: 0.5rem 0;
                }
                .item-row { border-bottom: 1px dotted #ccc; }
                .item-row:last-child { border-bottom: none; }
                .info-table td { padding: 2px 0; }
            </style>
        </head>
        <body>
            <!-- Logo or Icon -->
            <div class="text-center" style="margin-bottom: 0.5rem;">
                ${settings.receipt_logo_url ? `
                <img src="${settings.receipt_logo_url}" alt="Logo" style="width: 40px; height: auto; margin: 0 auto; display: block;" />
                ` : `
                <svg width="60" height="60" viewBox="0 0 512 512" style="margin: 0 auto; display: block;" fill="currentColor">
                    <path d="M432,192h-32V144a16,16,0,0,0-16-16H64a16,16,0,0,0-16,16v48H16a16,16,0,0,0,0,32H48v80c0,97.05,78.95,176,176,176h16c97.05,0,176-78.95,176-176V224h16a16,16,0,0,0,0-32ZM368,304c0,79.4-64.6,144-144,144H208c-79.4,0-144-64.6-144-144V160H368ZM160,304c0-26.51,21.49-48,48-48s48,21.49,48,48-21.49,48-48,48S160,330.51,160,304Zm48-16c8.82,0,16,7.18,16,16s-7.18,16-16,16-16-7.18-16-16S199.18,288,208,288Z"/>
                    <path d="M144,96a16,16,0,0,0,16-16V16a16,16,0,0,0-32,0V80A16,16,0,0,0,144,96Z"/>
                    <path d="M240,96a16,16,0,0,0,16-16V16a16,16,0,0,0-32,0V80A16,16,0,0,0,240,96Z"/>
                    <path d="M336,96a16,16,0,0,0,16-16V16a16,16,0,0,0-32,0V80A16,16,0,0,0,336,96Z"/>
                    <path d="M432,224H400v80c0,17.67,14.33,32,32,32s32-14.33,32-32V256A32,32,0,0,0,432,224Zm0,80c0,8.82-7.18,16-16,16s-16-7.18-16-16V256h16a16,16,0,0,1,16,16Z"/>
                </svg>
                `}
            </div>

            <div class="text-center" style="margin-bottom: 0.5rem;">
            <p style="white-space: pre-wrap; margin-bottom: 0.5rem;">----</p>
            </div>

            <!-- Header -->
            <div class="text-center mb-4">
                <div class="font-bold text-xl uppercase">${settings.name}</div>
                ${settings.address ? `<div class="text-xs"  style="margin-top: 0.5rem;">${settings.address}</div>` : ''}
                ${settings.phone ? `<div class="text-xs" style="margin-top: 0.2rem;">Tel: ${settings.phone}</div>` : ''}
                ${settings.tax_id ? `<div class="text-xs" style="margin-top: 0.2rem;">RUC: ${settings.tax_id}</div>` : ''}
            </div>

            <!-- Document Type -->
            ${order.document_number ? `
            <div class="doc-type text-center">
                <div class="uppercase">${order.document_type === 'ticket' ? 'TICKET' : order.document_type === 'boleta' ? 'BOLETA DE VENTA' : 'FACTURA ELECTRÓNICA'}</div>
                <div class="text-lg">${order.document_number}</div>
            </div>
            ` : ''}

            <!-- Order Info -->
            <div class="border-b mb-2">
                <table class="text-xs info-table">
                    <tr>
                        <td style="width: 30%">Fecha/Hora:</td>
                        <td>${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    </tr>
                    ${cashierName ? `
                    <tr>
                        <td>Cajero:</td>
                        <td>${cashierName}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td>Pedido:</td>
                        <td>#${order.id.slice(0, 8)}</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <div class="mb-2">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%">Producto</th>
                            <th style="width: 15%" class="text-center">Cant.</th>
                            <th style="width: 20%" class="text-right">P.U.</th>
                            <th style="width: 25%" class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
        const unitPrice = (item.manualPrice || (item.product.base_price + (item.variant?.price_adjustment || 0) + item.modifiers.reduce((s, m) => s + m.price, 0)));
        const total = unitPrice * item.quantity;
        const modifiers = item.modifiers.map(m => m.name).join(', ');
        return `
                                <tr class="item-row">
                                    <td>
                                        <div class="font-bold">${item.product.name}</div>
                                        ${item.variant ? `<div class="text-xs" style="color: #666;">${item.variant.name}</div>` : ''}
                                        ${modifiers ? `<div class="text-xs" style="color: #666;">+ ${modifiers}</div>` : ''}
                                        ${item.notes ? `<div class="text-xs" style="color: #999; font-style: italic;">Nota: ${item.notes}</div>` : ''}
                                    </td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-right">${formatCurrency(unitPrice)}</td>
                                    <td class="text-right font-bold">${formatCurrency(total)}</td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="border-t">
                <table class="text-xs info-table">
                    <tr>
                        <td class="text-right" style="width: 70%;">Subtotal:</td>
                        <td class="text-right">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    ${order.tax > 0 ? `
                    <tr>
                        <td class="text-right">IGV (18%):</td>
                        <td class="text-right">${formatCurrency(order.tax)}</td>
                    </tr>
                    <tr>
                        <td class="text-right font-bold text-lg">TOTAL:</td>
                        <td class="text-right font-bold text-lg">${formatCurrency(order.total_amount)}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <!-- Payment Info -->
            <div class="border-b mb-2">
                <table class="text-xs info-table">
                    <tr>
                        <td style="width: 50%;">Método de Pago:</td>
                        <td class="text-right font-bold uppercase">${order.payment_method === 'cash' ? 'Efectivo' :
            order.payment_method === 'card' ? 'Tarjeta' :
                order.payment_method === 'yape' ? 'Yape' :
                    order.payment_method === 'plin' ? 'Plin' :
                        order.payment_method === 'transfer' ? 'Transferencia' :
                            order.payment_method
        }</td>
                    </tr>
                    ${(order.payment_data as any)?.reference ? `
                    <tr>
                        <td>Nro. Operación:</td>
                        <td class="text-right font-bold">${(order.payment_data as any).reference}</td>
                    </tr>
                    ` : ''}
                    ${(order.payment_data as any)?.cardType ? `
                    <tr>
                        <td>Tipo de Tarjeta:</td>
                        <td class="text-right font-bold uppercase">${(order.payment_data as any).cardType === 'credit' ? 'Crédito' : 'Débito'}</td>
                    </tr>
                    ` : ''}
                    ${order.payment_method === 'cash' ? `
                    <tr>
                        <td>Pagado:</td>
                        <td class="text-right font-bold">${formatCurrency(order.amount_paid)}</td>
                    </tr>
                    <tr>
                        <td>Cambio:</td>
                        <td class="text-right font-bold">${formatCurrency(order.change_returned)}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <!-- Footer -->
            <div class="text-center text-xs">
                ${settings.qr_code_url ? `
                <div style="margin: 1rem 0;">
                    <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(settings.qr_code_url)}" 
                        alt="QR Code" 
                        style="width: 120px; height: 120px; margin: 0 auto; display: block;"
                    />
                    <p style="font-size: 9px; color: #666;">Escanea para más información</p>
                </div>
                ` : ''}
                ${settings.footer_message ? `<p style="white-space: pre-wrap;">${settings.footer_message}</p>` : ''}
                <p style="color: #999; font-size: 8px;">
                    Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                </p>
            </div>
        </body>
        </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for content to load then print
    iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
    };
};
