const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({
    name: { type: String, required: true },
    logo_url: { type: String },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Brand', brandSchema);
