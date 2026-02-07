const mongoose = require('mongoose');
const dotenv = require('dotenv');
const EmiPlan = require('./models/EmiPlan');
const Invoice = require('./models/Invoice');

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const emiPlans = await EmiPlan.find({});
        console.log(`Found ${emiPlans.length} EMI plans. Checking for orphans...`);

        let deletedCount = 0;
        for (const plan of emiPlans) {
            const invoice = await Invoice.findById(plan.invoiceId);
            if (!invoice) {
                console.log(`Deleting orphan EMI plan ID: ${plan._id} (Invoice ID: ${plan.invoiceId} not found)`);
                await EmiPlan.deleteOne({ _id: plan._id });
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphan EMI plans.`);
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanup();
