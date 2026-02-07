const mongoose = require('mongoose');

const emiPlanSchema = mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Invoice'
    },
    total_amount: {
        type: Number,
        required: true
    },
    down_payment: {
        type: Number,
        required: true,
        default: 0
    },
    loan_amount: {
        type: Number,
        required: true
    },
    interest_rate: {
        type: Number,
        required: true,
        default: 0
    },
    tenure_months: {
        type: Number,
        required: true
    },
    monthly_emi: {
        type: Number,
        required: true
    },
    total_payable: {
        type: Number,
        required: true
    },
    outstanding_balance: {
        type: Number,
        required: true
    },
    next_emi_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'overdue'],
        default: 'active'
    },
    emi_provider: {
        type: String,
        default: 'In-House'
    },
    payments: [{
        amount_paid: Number,
        payment_date: Date,
        payment_mode: String
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('EmiPlan', emiPlanSchema);
