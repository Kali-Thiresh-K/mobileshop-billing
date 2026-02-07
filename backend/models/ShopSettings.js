const mongoose = require('mongoose');

const shopSettingsSchema = mongoose.Schema({
    shop_name: { type: String, required: true, default: 'My Mobile Shop' },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    gst_number: { type: String },
    invoice_prefix: { type: String, default: 'INV-' },
    invoice_footer: { type: String, default: 'Thank you for your business!' },
    logo_url: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
