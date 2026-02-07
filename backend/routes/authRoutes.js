const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);

// DEBUG ROUTE - REMOVE IN PRODUCTION
router.get('/db-debug', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Product = require('../models/Product');
        const Customer = require('../models/Customer');

        const productCount = await Product.countDocuments();
        const customerCount = await Customer.countDocuments();

        res.json({
            status: 'connected',
            dbName: mongoose.connection.name,
            host: mongoose.connection.host,
            productCount,
            customerCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
