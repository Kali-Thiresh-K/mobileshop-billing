const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

// Simple inline controllers for these small resources
const getBrands = asyncHandler(async (req, res) => {
    const brands = await Brand.find({});
    res.json(brands);
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
});

router.get('/brands', getBrands);
router.get('/categories', getCategories);

module.exports = router;
