
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedAdmin } = require('./controllers/authController');

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);

        console.log('Running seeder...');
        await seedAdmin();

        console.log('Seeding completed successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
