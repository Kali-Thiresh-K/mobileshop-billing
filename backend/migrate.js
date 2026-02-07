
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables (for Atlas URI)
dotenv.config();

// Local DB URI (hardcoded as per user's context)
const LOCAL_URI = 'mongodb://127.0.0.1:27017/mobile-shop-genius';
const ATLAS_URI = process.env.MONGO_URI;

// Import all models
const Brand = require('./models/Brand');
const Category = require('./models/Category');
const Customer = require('./models/Customer');
const EmiPayment = require('./models/EmiPayment');
const EmiPlan = require('./models/EmiPlan');
const Invoice = require('./models/Invoice');
const Product = require('./models/Product');
const PurchaseOrder = require('./models/PurchaseOrder');
const Return = require('./models/Return');
const ShopSettings = require('./models/ShopSettings');
const Supplier = require('./models/Supplier');
const User = require('./models/User');

const migrate = async () => {
    let localData = {};

    try {
        console.log('--- Step 1: Connecting to Local MongoDB ---');
        await mongoose.connect(LOCAL_URI);
        console.log(`Connected to Local: ${mongoose.connection.host}`);

        // Fetch all data
        console.log('Fetching data from Local...');
        localData.brands = await Brand.find({});
        localData.categories = await Category.find({});
        localData.customers = await Customer.find({});
        localData.emiPayments = await EmiPayment.find({});
        localData.emiPlans = await EmiPlan.find({});
        localData.invoices = await Invoice.find({});
        localData.products = await Product.find({});
        localData.purchaseOrders = await PurchaseOrder.find({});
        localData.returns = await Return.find({});
        localData.shopSettings = await ShopSettings.find({});
        localData.suppliers = await Supplier.find({});
        localData.users = await User.find({});

        console.log(` fetched: 
            Brands: ${localData.brands.length}
            Categories: ${localData.categories.length}
            Customers: ${localData.customers.length}
            EMI Payments: ${localData.emiPayments.length}
            EMI Plans: ${localData.emiPlans.length}
            Invoices: ${localData.invoices.length}
            Products: ${localData.products.length}
            Purchase Orders: ${localData.purchaseOrders.length}
            Returns: ${localData.returns.length}
            Shop Settings: ${localData.shopSettings.length}
            Suppliers: ${localData.suppliers.length}
            Users: ${localData.users.length}
        `);

        await mongoose.disconnect();
        console.log('--- Step 1: Done (Disconnected from Local) ---');

    } catch (error) {
        console.error('Error fetching local data:', error);
        process.exit(1);
    }

    try {
        console.log('\n--- Step 2: Connecting to MongoDB Atlas ---');
        await mongoose.connect(ATLAS_URI);
        console.log(`Connected to Atlas: ${mongoose.connection.host}`);

        // Insert data (clearing first to avoid duplicates/conflicts)
        console.log('Clearing existing Atlas data...');
        await Brand.deleteMany({});
        await Category.deleteMany({});
        await Customer.deleteMany({});
        await EmiPayment.deleteMany({});
        await EmiPlan.deleteMany({});
        await Invoice.deleteMany({});
        await Product.deleteMany({});
        await PurchaseOrder.deleteMany({});
        await Return.deleteMany({});
        await ShopSettings.deleteMany({});
        await Supplier.deleteMany({});
        await User.deleteMany({});

        console.log('Inserting local data into Atlas...');
        if (localData.brands.length) await Brand.insertMany(localData.brands);
        if (localData.categories.length) await Category.insertMany(localData.categories);
        if (localData.customers.length) await Customer.insertMany(localData.customers);
        if (localData.emiPayments.length) await EmiPayment.insertMany(localData.emiPayments);
        if (localData.emiPlans.length) await EmiPlan.insertMany(localData.emiPlans);
        if (localData.invoices.length) await Invoice.insertMany(localData.invoices);
        if (localData.products.length) await Product.insertMany(localData.products);
        if (localData.purchaseOrders.length) await PurchaseOrder.insertMany(localData.purchaseOrders);
        if (localData.returns.length) await Return.insertMany(localData.returns);
        if (localData.shopSettings.length) await ShopSettings.insertMany(localData.shopSettings);
        if (localData.suppliers.length) await Supplier.insertMany(localData.suppliers);
        if (localData.users.length) await User.insertMany(localData.users);

        console.log('--- Step 2: Done (Data Migrated) ---');
        process.exit(0);

    } catch (error) {
        console.error('Error rewriting to Atlas:', error);
        process.exit(1);
    }
};

migrate();
