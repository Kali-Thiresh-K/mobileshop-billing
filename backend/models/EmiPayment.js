const mongoose = require('mongoose');

const emiPaymentSchema = mongoose.Schema({
    emiPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmiPlan', required: true },
    amount_paid: { type: Number, required: true },
    payment_date: { type: Date, default: Date.now },
    payment_mode: { type: String, enum: ['cash', 'card', 'upi'], default: 'cash' },
    late_fee: { type: Number, default: 0 },
    notes: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('EmiPayment', emiPaymentSchema);
