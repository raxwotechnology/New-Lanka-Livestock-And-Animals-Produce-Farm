import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send an invoice creation email (hardcoded override as requested).
 */
export const sendInvoiceCreationEmail = async (invoice) => {
    try {
        if (!invoice) return null;

        // Ensure email credentials exist
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('[Email Service] Skipping invoice email. SMTP not configured.');
            return null;
        }

        const transporter = createTransporter();

        const amountStr = invoice.grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 });
        const itemCount = invoice.items?.length || 0;

        let customerEmail = 'N/A';
        if (invoice.customerId) {
            const Customer = mongoose.model('Customer');
            const customer = await Customer.findById(invoice.customerId);
            if (customer) {
                customerEmail = customer.primaryContact?.email || customer.email || 'N/A';
            }
        }

        if (customerEmail === 'N/A') {
            console.log(`[Email Service] Skipping Email for Invoice ${invoice.invoiceNumber} - No valid customer email.`);
            return null;
        }

        const mailOptions = {
            from: '"New Lanka Livestock" <janstephan06@gmail.com>',
            to: customerEmail,
            subject: `Invoice #${invoice.invoiceNumber} - New Lanka Livestock And Animals Produce Farm`,
            text: `Dear Customer,\n\nThank you for your purchase at New Lanka Livestock Farm!\n\nInvoice #${invoice.invoiceNumber} amounting to LKR ${amountStr} has been successfully issued.\nTotal items: ${itemCount}.\n\nFor inquiries: 0760348159`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2c3e50;">New Lanka Livestock And Animals Produce Farm</h2>
                    <p>Dear Customer,</p>
                    <p>Thank you for your purchase!</p>
                    <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>Total Amount:</strong> LKR ${amountStr}</p>
                    <p><strong>Total Items:</strong> ${itemCount}</p>
                    <br/>
                    <p>For inquiries, please contact us at: <strong>0760348159</strong></p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Dispatched Invoice ${invoice.invoiceNumber} email to ${customerEmail}. MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Email Service] Failed to send email:', error.message);
        return null;
    }
};
