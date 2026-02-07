const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const EmiPlan = require('../models/EmiPlan');
const Return = require('../models/Return');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({})
        .populate('customerId', 'name phone')
        .populate('userId', 'full_name');
    res.json(invoices);
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('customerId', 'name phone')
        .populate('userId', 'full_name')
        .populate('items.productId', 'name selling_price');

    if (invoice) {
        res.json(invoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
    const {
        items,
        customerId,
        payment_mode,
        discount_amount,
        cgst_amount,
        sgst_amount,
        subtotal,
        grand_total,
        amount_paid,
        emiDetails // New optional object { down_payment, interest_rate, tenure_months, processing_fee }
    } = req.body;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No invoice items');
        return;
    } else {
        const invoice = new Invoice({
            userId: req.user._id,
            invoice_number: 'INV-' + Date.now(),
            items,
            customerId,
            payment_mode,
            discount_amount,
            cgst_amount,
            sgst_amount,
            subtotal,
            grand_total,
            amount_paid, // For EMI, this is the Down Payment
            balance_due: grand_total - amount_paid,
        });

        const createdInvoice = await invoice.save();

        // Decrease stock
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock_quantity -= item.quantity;
                await product.save();
            }
        }

        // Update Customer stats
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (customer) {
                customer.total_purchases = (customer.total_purchases || 0) + grand_total;
                customer.outstanding_balance = (customer.outstanding_balance || 0) + (grand_total - amount_paid);
                await customer.save();
            }

            // Create EMI Plan if payment mode is EMI
            if (payment_mode === 'emi') {
                // Use provided EMI details or fallbacks
                const downPayment = emiDetails?.down_payment || amount_paid;
                const loanAmount = grand_total - downPayment;
                const tenure = emiDetails?.tenure_months || 6;
                const interestRate = emiDetails?.interest_rate || 0;

                // Calculate Monthly EMI
                // Formula: [P x R x (1+R)^N]/[(1+R)^N-1] for reducing balance, 
                // OR Simple Interest: (Principal + Interest) / Months for flat rate.
                // Using Flat Rate as it's common in retail:
                // Interest Amount = Loan * (Rate/100) * (Tenure/12) -- IF rate is per annum.
                // Usually small shops use monthly flat rate or just total flat percentage.
                // Let's assume Rate is Annual for professional standard.

                let monthlyEmi;
                let totalPayable;

                if (interestRate > 0) {
                    // PMT Formula for reducing balance: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
                    // where r = annual_rate / 12 / 100
                    const r = interestRate / 12 / 100;
                    const n = tenure;
                    monthlyEmi = Math.ceil(loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
                    totalPayable = monthlyEmi * n;
                } else {
                    monthlyEmi = Math.ceil(loanAmount / tenure);
                    totalPayable = loanAmount;
                }

                // Get the first product (usually main item) for reference
                const productId = items[0].productId;

                const nextDate = new Date();
                nextDate.setMonth(nextDate.getMonth() + 1);

                const emiPlan = new EmiPlan({
                    customerId,
                    productId,
                    invoiceId: createdInvoice._id,
                    total_amount: grand_total,
                    down_payment: downPayment,
                    loan_amount: loanAmount,
                    interest_rate: interestRate,
                    tenure_months: tenure,
                    monthly_emi: monthlyEmi,
                    total_payable: totalPayable,
                    outstanding_balance: totalPayable, // Initial outstanding is total payable including interest
                    next_emi_date: nextDate,
                    status: 'active'
                });

                await emiPlan.save();

                // Note: Customer outstanding balance in DB is usually just Principal due (for accounting)
                // or Total Payable (including interest). 
                // Usually accounting tracks Principal. Interest is income earned over time.
                // But specifically for the "Outstanding Balance" field on customer card, 
                // typically shopkeepers want to see "How much does he owe me TOTAL?".
                // So updating customer outstanding to match EMI Total Payable might be better if they want to track debt.
                // For now, I'll keep the standard logic: Outstanding = Principal Loan Amount. 
                // Modifying it to add interest difference if needed later.
                if (totalPayable > loanAmount) {
                    customer.outstanding_balance += (totalPayable - loanAmount);
                    await customer.save();
                }
            }
        }

        res.status(201).json(createdInvoice);
    }
});

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
        // Find associated returns
        const returns = await Return.find({ invoiceId: invoice._id });

        // Calculate total returned quantity per product and total refunded amount
        const returnedQtyMap = {}; // { productId: qty }
        let totalRefundedAmount = 0;

        returns.forEach(ret => {
            totalRefundedAmount += (ret.total_refund || 0);
            ret.items.forEach(item => {
                const pid = item.productId.toString();
                returnedQtyMap[pid] = (returnedQtyMap[pid] || 0) + item.quantity;
            });
        });

        // 1. Restore Product Stock
        // Only restore what was NOT returned (since returned items were already added back to stock)
        for (const item of invoice.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                const pid = item.productId.toString();
                const returnedQty = returnedQtyMap[pid] || 0;
                const qtyToRestore = Math.max(0, item.quantity - returnedQty);

                if (qtyToRestore > 0) {
                    product.stock_quantity += qtyToRestore;
                    await product.save();
                }
            }
        }

        // 2. Revert Customer Stats
        if (invoice.customerId) {
            const customer = await Customer.findById(invoice.customerId);
            if (customer) {
                // We need to revert the NET effect of this invoice on total_purchases.
                // Effect was: +InvoiceTotal (at purchase) - RefundAmount (at return).
                // So TotalPurchases = X + InvoiceTotal - RefundAmount.
                // To revert: NewTotal = CurrentTotal - (InvoiceTotal - RefundAmount).
                // Example: Buy 100. Return 20. Total = 80.
                // Delete Invoice: Should go to 0. 80 - (100 - 20) = 0. Correct.
                const netPurchaseAmount = invoice.grand_total - totalRefundedAmount;
                customer.total_purchases = Math.max(0, (customer.total_purchases || 0) - netPurchaseAmount);

                // Outstanding Balance:
                // Purchase effect: +BalanceDue.
                // Return effect: Usually doesn't touch outstanding unless it's a CREDIT refund.
                // My return logic: `customer.total_purchases -= total_refund`. 
                // It didn't touch outstanding balance in the basic implementation unless customized.
                // Assuming standard logic: Delete reduces outstanding by the invoices remaining balance due.
                const invoiceBalanceDue = invoice.balance_due || 0;
                customer.outstanding_balance = Math.max(0, (customer.outstanding_balance || 0) - invoiceBalanceDue);

                await customer.save();
            }
        }

        // 3. Delete associated EMI Plan
        if (invoice.payment_mode === 'emi') {
            await EmiPlan.deleteOne({ invoiceId: invoice._id });
        }

        // 4. Delete associated Returns
        if (returns.length > 0) {
            await Return.deleteMany({ invoiceId: invoice._id });
        }

        await Invoice.deleteOne({ _id: invoice._id });
        res.json({ message: 'Invoice and associated returns removed' });
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    deleteInvoice,
};
