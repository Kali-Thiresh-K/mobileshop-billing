const asyncHandler = require('express-async-handler');
const ShopSettings = require('../models/ShopSettings');

// @desc    Get shop settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    let settings = await ShopSettings.findOne(); // Assuming single settings doc
    if (!settings) {
        // Return default empty settings if not found, or create one
        settings = {};
    }
    res.json(settings);
});

// @desc    Update shop settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    let settings = await ShopSettings.findOne();

    if (settings) {
        Object.assign(settings, req.body);
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } else {
        // Create new
        const newSettings = new ShopSettings(req.body);
        const created = await newSettings.save();
        res.status(201).json(created);
    }
});

module.exports = { getSettings, updateSettings };
