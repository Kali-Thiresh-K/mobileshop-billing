const asyncHandler = require('express-async-handler');
const EmiPlan = require('../models/EmiPlan');

// @desc    Get all EMI plans
// @route   GET /api/emi/plans
// @access  Private
const getEmiPlans = asyncHandler(async (req, res) => {
    const plans = await EmiPlan.find({})
        .populate('customerId', 'name phone')
        .populate('productId', 'name');
    res.json(plans);
});

// @desc    Record EMI payment
// @route   POST /api/emi/plans/:id/payments
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
    const plan = await EmiPlan.findById(req.params.id);

    if (plan) {
        const { amount_paid, payment_date, payment_mode } = req.body;

        const payment = {
            amount_paid,
            payment_date,
            payment_mode
        };

        plan.payments.push(payment);

        // Update outstanding balance
        plan.outstanding_balance = Math.max(0, plan.outstanding_balance - amount_paid);

        // Update status if fully paid
        if (plan.outstanding_balance === 0) {
            plan.status = 'completed';
        }

        // Update next EMI date (add 1 month)
        // Only update if not completed and if needed. For now, simple logic.
        if (plan.status !== 'completed') {
            const nextDate = new Date(plan.next_emi_date);
            nextDate.setMonth(nextDate.getMonth() + 1);
            plan.next_emi_date = nextDate;
        }

        const updatedPlan = await plan.save();
        res.json(updatedPlan);
    } else {
        res.status(404);
        throw new Error('EMI Plan not found');
    }
});

// @desc    Create EMI Plan (Internal use or manual)
// @route   POST /api/emi/plans
// @access  Private
const createEmiPlan = asyncHandler(async (req, res) => {
    const plan = new EmiPlan(req.body);
    const createdPlan = await plan.save();
    res.status(201).json(createdPlan);
});

module.exports = {
    getEmiPlans,
    recordPayment,
    createEmiPlan
};
