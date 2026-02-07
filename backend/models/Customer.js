const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gst_number: { type: String },
    notes: { type: String },
    customer_type: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    outstanding_balance: { type: Number, default: 0 },
    total_purchases: { type: Number, default: 0 },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Customer', customerSchema);
