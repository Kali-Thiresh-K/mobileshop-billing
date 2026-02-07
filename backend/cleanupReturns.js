const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Return = require('./models/Return');
const Invoice = require('./models/Invoice');
const connectDB = require('./config/db');

dotenv.config();

const cleanupReturns = async () => {
    try {
        await connectDB();

        console.log('Scanning for orphaned returns...');

        const returns = await Return.find({});
        let deletedCount = 0;

        for (const ret of returns) {
            // Check if invoice exists
            const invoice = await Invoice.findById(ret.invoiceId);

            if (!invoice) {
                console.log(`Deleting return ${ret.return_number} (ID: ${ret._id}) - Invoice ${ret.invoiceId} not found.`);
                await Return.deleteOne({ _id: ret._id });
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphaned returns.`);
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupReturns();
