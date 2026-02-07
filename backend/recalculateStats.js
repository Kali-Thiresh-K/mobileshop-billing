
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const EmiPlan = require('./models/EmiPlan');

const recalculate = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers. Recalculating...`);

        for (const customer of customers) {
            // 1. Calculate Total Purchases
            const invoices = await Invoice.find({ customerId: customer._id });
            const totalPurchases = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

            // 2. Calculate Outstanding Balance
            // Non-EMI Invoices: balance_due
            const nonEmiInvoices = invoices.filter(inv => inv.payment_mode !== 'emi');
            const nonEmiOutstanding = nonEmiInvoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

            // EMI Plans: outstanding_balance
            const emiPlans = await EmiPlan.find({ customerId: customer._id, status: 'active' });
            const emiOutstanding = emiPlans.reduce((sum, plan) => sum + (plan.outstanding_balance || 0), 0);

            const totalOutstanding = nonEmiOutstanding + emiOutstanding;

            console.log(`Customer: ${customer.name}`);
            console.log(`  Old: Purchases=${customer.total_purchases}, Outstanding=${customer.outstanding_balance}`);
            console.log(`  New: Purchases=${totalPurchases}, Outstanding=${totalOutstanding}`);

            customer.total_purchases = totalPurchases;
            customer.outstanding_balance = totalOutstanding;
            await customer.save();
        }

        console.log('Recalculation complete.');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

recalculate();
