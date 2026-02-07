const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .populate('supplierId', 'name');
    res.json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('categoryId', 'name')
        .populate('brandId', 'name');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
    let image_url = null;
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    const product = new Product({
        ...req.body,
        stock_quantity: Number(req.body.stock_quantity),
        cost_price: Number(req.body.cost_price),
        selling_price: Number(req.body.selling_price),
        image_url: image_url || req.body.image_url, // Allow image_url from body if no file uploaded
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        let image_url = product.image_url;
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        Object.assign(product, req.body);
        product.image_url = image_url; // Explicitly set it in case Object.assign missed it or valid logic overwrite

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
