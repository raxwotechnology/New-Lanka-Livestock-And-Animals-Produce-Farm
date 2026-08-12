import { forwardRef } from 'react';

const fmt = (n) => new Intl.NumberFormat('en-LK', {
    style: 'currency', currency: 'LKR', minimumFractionDigits: 2,
}).format(n || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
}) : '—';

/**
 * Printable invoice — renders inside a hidden div.
 * Designed for A4 portrait at 96dpi (~794×1123 px).
 *
 * companyInfo: { name, address, taxNumber, phone, email, logo }
 * invoice: full populated invoice doc
 * payments: array of payments allocated to this invoice
 */
const PrintableInvoice = forwardRef(({ companyInfo, invoice, payments = [], template = 'a4' }, ref) => {
    if (!invoice) return null;

    const customer = invoice.customerSnapshot || {};
    const billingAddr = invoice.billingAddress || {};
    const shippingAddr = invoice.shippingAddress || billingAddr;

    const totalPaid = payments.reduce((sum, p) => {
        const alloc = p.allocations?.find((a) =>
            (a.documentId?._id?.toString() || a.documentId?.toString()) === invoice._id.toString()
        );
        return sum + (alloc?.amount || 0);
    }, 0);

    const balanceDue = invoice.grandTotal - totalPaid;

    // POS Thermal Format
    if (template === 'pos') {
        return (
            <div ref={ref} className="print-container bg-white text-black p-4 max-w-[300px] mx-auto font-sans text-xs">
                <div className="text-center mb-4 pb-2 border-b border-gray-400 border-dashed">
                    {companyInfo?.logo && (
                        <img src={companyInfo.logo} alt="Logo" className="h-12 mx-auto mb-2" />
                    )}
                    <h1 className="font-bold text-sm">{companyInfo?.name || 'Your Company'}</h1>
                    <p>{companyInfo?.address}</p>
                    {companyInfo?.phone && <p>Tel: {companyInfo.phone}</p>}
                </div>
                
                <div className="mb-4">
                    <p className="font-bold text-center mb-1">RECEIPT / INVOICE</p>
                    <p>Inv #: {invoice.invoiceNumber}</p>
                    <p>Date: {formatDate(invoice.invoiceDate)}</p>
                    <p>Customer: {customer.name}</p>
                </div>

                <table className="w-full mb-4">
                    <thead className="border-b border-gray-400 border-dashed">
                        <tr>
                            <th className="text-left font-semibold pb-1">Item</th>
                            <th className="text-right font-semibold pb-1 w-12">Qty</th>
                            <th className="text-right font-semibold pb-1 w-16">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(invoice.items || []).map((item, idx) => {
                            const lineSub = (item.quantity || 0) * (item.unitPrice || 0);
                            const lineDisc = lineSub * ((item.discountPercent || 0) / 100);
                            const lineTax = (item.taxable ? (lineSub - lineDisc) : 0) * ((item.taxRate || 0) / 100);
                            const lineTotal = lineSub - lineDisc + lineTax;
                            return (
                                <tr key={idx}>
                                    <td className="py-1 align-top pr-1">{item.productName}</td>
                                    <td className="py-1 text-right align-top">{item.quantity}</td>
                                    <td className="py-1 text-right align-top">{fmt(lineTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="border-t border-gray-400 border-dashed pt-2 mb-4">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(invoice.subtotal)}</span></div>
                    {invoice.totalDiscount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-{fmt(invoice.totalDiscount)}</span></div>}
                    {invoice.totalTax > 0 && <div className="flex justify-between"><span>Tax:</span><span>{fmt(invoice.totalTax)}</span></div>}
                    <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-gray-400">
                        <span>TOTAL:</span><span>{fmt(invoice.grandTotal)}</span>
                    </div>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-gray-400 border-dashed text-[10px]">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        );
    }

    // A4 and Half-A4 Formats
    const isHalf = template === 'half-a4';
    const containerClasses = `print-container bg-white text-black mx-auto ${isHalf ? 'max-w-[800px] p-6' : 'max-w-[800px] p-10'}`;
    const headerClasses = isHalf ? 'h-10 mb-1' : 'h-16 mb-2';

    return (
        <div ref={ref} className={containerClasses}>
            {/* Header */}
            <div className={`flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800 ${isHalf ? 'mb-4 pb-2' : ''}`}>
                <div>
                    {companyInfo?.logo && (
                        <img src={companyInfo.logo} alt="Logo" className={headerClasses} />
                    )}
                    <h1 className={`${isHalf ? 'text-xl' : 'text-2xl'} font-bold`}>{companyInfo?.name || 'Your Company'}</h1>
                    {companyInfo?.address && <p className="text-sm">{companyInfo.address}</p>}
                    {companyInfo?.taxNumber && <p className="text-sm">Tax No: {companyInfo.taxNumber}</p>}
                    <p className="text-sm">
                        {companyInfo?.phone && `Tel: ${companyInfo.phone}`}
                        {companyInfo?.email && ` · ${companyInfo.email}`}
                    </p>
                </div>
                <div className="text-right">
                    <h2 className={`${isHalf ? 'text-2xl' : 'text-3xl'} font-bold text-gray-700`}>INVOICE</h2>
                    <p className="text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
                </div>
            </div>

            {/* Bill To / Dates */}
            <div className={`grid grid-cols-2 gap-6 ${isHalf ? 'mb-4' : 'mb-6'}`}>
                <div>
                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Bill To</p>
                    <p className="font-semibold">{customer.name}</p>
                    {customer.code && <p className="text-sm text-gray-600">{customer.code}</p>}
                    {billingAddr.line1 && <p className="text-sm">{billingAddr.line1}</p>}
                    {billingAddr.line2 && <p className="text-sm">{billingAddr.line2}</p>}
                    {(billingAddr.city || billingAddr.state) && (
                        <p className="text-sm">{billingAddr.city}{billingAddr.state ? `, ${billingAddr.state}` : ''}</p>
                    )}
                    {customer.taxRegistrationNumber && (
                        <p className="text-sm mt-1">Tax No: {customer.taxRegistrationNumber}</p>
                    )}
                    {customer.phone && <p className="text-sm">Tel: {customer.phone}</p>}
                </div>

                <div>
                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Invoice Details</p>
                    <table className="text-sm w-full">
                        <tbody>
                            <tr><td className="text-gray-600 pr-2">Invoice Date:</td><td className="text-right">{formatDate(invoice.invoiceDate)}</td></tr>
                            <tr><td className="text-gray-600 pr-2">Due Date:</td><td className="text-right font-semibold">{formatDate(invoice.dueDate)}</td></tr>
                            {invoice.salesOrderId?.orderNumber && (
                                <tr><td className="text-gray-600 pr-2">Order Ref:</td><td className="text-right">{invoice.salesOrderId.orderNumber}</td></tr>
                            )}
                            {invoice.paymentTerms?.type && (
                                <tr><td className="text-gray-600 pr-2">Terms:</td>
                                    <td className="text-right">
                                        {invoice.paymentTerms.type === 'credit'
                                            ? `${invoice.paymentTerms.creditDays} days credit`
                                            : invoice.paymentTerms.type.toUpperCase()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Line items */}
            <table className={`w-full ${isHalf ? 'mb-4' : 'mb-6'}`}>
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left p-2 text-xs uppercase font-semibold border-b border-gray-300 w-8">#</th>
                        <th className="text-left p-2 text-xs uppercase font-semibold border-b border-gray-300">Description</th>
                        <th className="text-right p-2 text-xs uppercase font-semibold border-b border-gray-300 w-16">Qty</th>
                        <th className="text-right p-2 text-xs uppercase font-semibold border-b border-gray-300 w-24">Unit Price</th>
                        <th className="text-right p-2 text-xs uppercase font-semibold border-b border-gray-300 w-16">Disc%</th>
                        <th className="text-right p-2 text-xs uppercase font-semibold border-b border-gray-300 w-16">Tax%</th>
                        <th className="text-right p-2 text-xs uppercase font-semibold border-b border-gray-300 w-28">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(invoice.items || []).map((item, idx) => {
                        const lineSub = (item.quantity || 0) * (item.unitPrice || 0);
                        const lineDisc = lineSub * ((item.discountPercent || 0) / 100);
                        const taxableBase = item.taxable ? (lineSub - lineDisc) : 0;
                        const lineTax = taxableBase * ((item.taxRate || 0) / 100);
                        const lineTotal = lineSub - lineDisc + lineTax;

                        return (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="p-2 text-sm">{idx + 1}</td>
                                <td className="p-2 text-sm">
                                    <div className="font-medium">{item.productName}</div>
                                    {item.productCode && <div className="text-xs text-gray-500 font-mono">{item.productCode}</div>}
                                </td>
                                <td className="p-2 text-sm text-right">{item.quantity} {item.unitOfMeasure || ''}</td>
                                <td className="p-2 text-sm text-right">{fmt(item.unitPrice)}</td>
                                <td className="p-2 text-sm text-right">{item.discountPercent || 0}%</td>
                                <td className="p-2 text-sm text-right">{item.taxRate || 0}%</td>
                                <td className="p-2 text-sm text-right font-medium">{fmt(lineTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Totals */}
            <div className={`flex justify-end ${isHalf ? 'mb-4' : 'mb-6'}`}>
                <table className="text-sm w-72">
                    <tbody>
                        <tr>
                            <td className="text-gray-600 py-1">Subtotal:</td>
                            <td className="text-right py-1">{fmt(invoice.subtotal)}</td>
                        </tr>
                        {invoice.totalDiscount > 0 && (
                            <tr>
                                <td className="text-gray-600 py-1">Discount:</td>
                                <td className="text-right py-1 text-red-600">-{fmt(invoice.totalDiscount)}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="text-gray-600 py-1">Tax (VAT):</td>
                            <td className="text-right py-1">{fmt(invoice.totalTax)}</td>
                        </tr>
                        {invoice.shippingCost > 0 && (
                            <tr>
                                <td className="text-gray-600 py-1">Shipping:</td>
                                <td className="text-right py-1">{fmt(invoice.shippingCost)}</td>
                            </tr>
                        )}
                        <tr className="border-t-2 border-gray-800">
                            <td className="font-bold py-2 text-base">Grand Total:</td>
                            <td className="text-right font-bold py-2 text-base">{fmt(invoice.grandTotal)}</td>
                        </tr>
                        {totalPaid > 0 && (
                            <>
                                <tr>
                                    <td className="text-gray-600 py-1">Amount Paid:</td>
                                    <td className="text-right py-1 text-green-700">{fmt(totalPaid)}</td>
                                </tr>
                                <tr className="border-t border-gray-400">
                                    <td className="font-bold py-2">Balance Due:</td>
                                    <td className={`text-right font-bold py-2 ${balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                        {fmt(balanceDue)}
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / notes */}
            {invoice.notes && !isHalf && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
            )}

            <div className={`text-center text-xs text-gray-500 pt-4 border-t border-gray-200 ${isHalf ? 'mt-4' : 'mt-8'}`}>
                Thank you for your business.
                {balanceDue > 0 && (
                    <p className="mt-1">Please make payment by <strong>{formatDate(invoice.dueDate)}</strong>.</p>
                )}
            </div>
        </div>
    );
});

PrintableInvoice.displayName = 'PrintableInvoice';
export default PrintableInvoice;