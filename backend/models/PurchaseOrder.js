const mongoose = require('mongoose');

const purchaseOrderSchema = mongoose.Schema({
    po_number: { type: String, required: true, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        unit_cost: { type: Number, required: true },
        total_cost: { type: Number, required: true },
        imei_numbers: [{ type: String }]
    }],

    total_amount: { type: Number, required: true },
    amount_paid: { type: Number },
    balance_due: { type: Number },
    status: { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
    notes: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
