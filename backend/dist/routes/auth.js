"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_shopify_key';
// POST /register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    try {
        // Check if user already exists
        const userExists = await db_js_1.pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Insert user
        const newUser = await db_js_1.pool.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at', [email.toLowerCase(), hashedPassword, name, 'user']);
        const user = newUser.rows[0];
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Registration failed. Server error.' });
    }
});
// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const userResult = await db_js_1.pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const user = userResult.rows[0];
        // Compare passwords
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        // Remove password
        delete user.password;
        return res.json({ token, user });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login failed. Server error.' });
    }
});
// GET /me
router.get('/me', auth_js_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const userResult = await db_js_1.pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(userResult.rows[0]);
    }
    catch (error) {
        console.error('Fetch user error:', error);
        return res.status(500).json({ message: 'Failed to retrieve profile' });
    }
});
exports.default = router;
