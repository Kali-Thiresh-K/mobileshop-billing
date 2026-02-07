const asyncHandler = require('express-async-handler');
const Return = require('../models/Return');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private
const getReturns = asyncHandler(async (req, res) => {
    const returns = await Return.find({})
        .populate('invoiceId', 'invoice_number')
        .populate('customerId', 'name phone')
        .populate('items.productId', 'name')
        .populate('userId', 'full_name') // Assuming User model has full_name
        .sort({ createdAt: -1 });
    res.json(returns);
});

// @desc    Create a new return
// @route   POST /api/returns
// @access  Private
const createReturn = asyncHandler(async (req, res) => {
    const {
        invoiceId,
        customerId,
        items, // Array of { productId, quantity, refund_amount, reason }
        total_refund,
        refund_mode,
        reason
    } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No return items');
    }

    // 1. Create Return Record
    const returnRecord = new Return({
        return_number: 'RET-' + Date.now(),
        invoiceId,
        customerId,
        userId: req.user._id,
        items,
        total_refund,
        refund_mode,
        reason
    });

    const createdReturn = await returnRecord.save();

    // 2. Update Product Stock (Increment)
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.stock_quantity += parseInt(item.quantity);
            await product.save();
        }
    }

    // 3. Update Customer Stats (Optional but recommended)
    // Reduce total_purchases by refund amount?
    // Or if refund_mode was CREDIT, adjust outstanding logic etc.
    // For now, let's just reduce total_purchases to keep analytics accurate.
    if (customerId) {
        const customer = await Customer.findById(customerId);
        if (customer) {
            customer.total_purchases = Math.max(0, (customer.total_purchases || 0) - total_refund);
            await customer.save();
        }
    }

    res.status(201).json(createdReturn);
});

module.exports = {
    getReturns,
    createReturn
};
