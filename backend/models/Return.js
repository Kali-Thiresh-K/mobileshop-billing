const mongoose = require('mongoose');

const returnSchema = mongoose.Schema({
    return_number: { type: String, required: true, unique: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        refund_amount: { type: Number, required: true },
        imei_returned: { type: String }
    }],

    total_refund: { type: Number, required: true },
    refund_mode: { type: String, enum: ['cash', 'card', 'upi'], default: 'cash' },
    reason: { type: String },

}, {
    timestamps: true,
});

module.exports = mongoose.model('Return', returnSchema);
