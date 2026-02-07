const mongoose = require('mongoose');

const invoiceItemSchema = mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    gst_rate: { type: Number },
    cgst_amount: { type: Number },
    sgst_amount: { type: Number },
    discount_percent: { type: Number },
    imei_sold: { type: String }, // For phones
});

const invoiceSchema = mongoose.Schema({
    invoice_number: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who created the invoice

    items: [invoiceItemSchema],

    subtotal: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    total_gst: { type: Number, default: 0 },
    cgst_amount: { type: Number, default: 0 },
    sgst_amount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    amount_paid: { type: Number, required: true },
    balance_due: { type: Number, default: 0 },

    payment_mode: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'emi'], default: 'cash' },
    notes: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
