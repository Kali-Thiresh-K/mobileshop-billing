const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { full_name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        full_name,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Seed Admin User
const seedAdmin = async () => {
    try {
        const adminEmail = "admin@mobileshop.com";
        const adminPassword = "admin123";

        // Always ensure the admin exists with the correct password
        const user = await User.findOne({ email: adminEmail });

        if (user) {
            // Update password if user exists
            user.password = adminPassword;
            user.role = "admin";
            await user.save();
            console.log("Default admin updated: admin@mobileshop.com / admin123");
        } else {
            // Create user if not exists
            await User.create({
                full_name: "Admin User",
                email: adminEmail,
                password: adminPassword,
                role: "admin",
            });
            console.log("Default admin created: admin@mobileshop.com / admin123");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};

module.exports = { authUser, registerUser, getUserProfile, seedAdmin };
