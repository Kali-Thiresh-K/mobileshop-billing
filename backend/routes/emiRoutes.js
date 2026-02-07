const express = require('express');
const router = express.Router();
const {
    getEmiPlans,
    createEmiPlan,
    recordPayment,
} = require('../controllers/emiController');
const { protect } = require('../middleware/authMiddleware');

router.route('/plans').get(protect, getEmiPlans).post(protect, createEmiPlan);
router.route('/plans/:id/payments').post(protect, recordPayment);

module.exports = router;
