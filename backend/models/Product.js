const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String },
    barcode: { type: String },
    description: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    cost_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    mrp: { type: Number },

    stock_quantity: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },

    imei1: { type: String },
    imei2: { type: String },
    variant: { type: String }, // For storage/color variants
    model: { type: String },

    gst_rate: { type: Number, default: 18 },
    hsn_code: { type: String },

    images: [{ type: String }],
    image_url: { type: String }, // Main product image

    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
