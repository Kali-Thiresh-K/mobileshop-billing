const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
    name: { type: String, required: true },
    contact_person: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gst_number: { type: String },
    balance: { type: Number, default: 0 },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Supplier', supplierSchema);
