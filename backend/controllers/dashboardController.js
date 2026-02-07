const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const EmiPlan = require('../models/EmiPlan');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's sales
    const todayInvoices = await Invoice.find({ createdAt: { $gte: today } });
    const todaySales = todayInvoices.reduce((acc, inv) => acc + inv.grand_total, 0);

    // Monthly sales
    const monthlyInvoices = await Invoice.find({ createdAt: { $gte: startOfMonth } });
    const monthlySales = monthlyInvoices.reduce((acc, inv) => acc + inv.grand_total, 0);

    // Counts
    const productCount = await Product.countDocuments();
    const customerCount = await Customer.countDocuments();
    const invoiceCount = await Invoice.countDocuments();

    // Low stock products
    const lowStockProducts = await Product.find({
        stock_quantity: { $gt: 0, $lt: 5 }
    }).limit(10);

    // Out of stock count
    const outOfStockCount = await Product.countDocuments({ stock_quantity: 0 });

    // Recent sales
    const recentSales = await Invoice.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name');

    // Pending EMI
    const activeEmiPlans = await EmiPlan.find({ status: 'active' });
    const pendingEmi = activeEmiPlans.reduce((acc, plan) => acc + plan.outstanding_balance, 0);

    res.json({
        todaySales,
        monthlySales,
        productCount,
        customerCount,
        invoiceCount,
        lowStockProducts,
        outOfStockCount,
        recentSales,
        pendingEmi,
    });
});

module.exports = { getDashboardStats };
