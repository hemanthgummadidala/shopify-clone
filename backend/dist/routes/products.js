"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET / - Get products with optional search and filter
router.get('/', async (req, res) => {
    const { search, category } = req.query;
    try {
        let query = 'SELECT * FROM products';
        const params = [];
        const conditions = [];
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }
        if (category && category !== 'All') {
            params.push(category);
            conditions.push(`category = $${params.length}`);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        // Sort by id descending so newly added products show up first
        query += ' ORDER BY id DESC';
        const result = await db_js_1.pool.query(query, params);
        return res.json(result.rows);
    }
    catch (error) {
        console.error('Fetch products error:', error);
        return res.status(500).json({ message: 'Failed to retrieve products' });
    }
});
// GET /categories - Get list of distinct categories
router.get('/categories', async (req, res) => {
    try {
        const result = await db_js_1.pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
        const categories = result.rows.map(row => row.category);
        return res.json(categories);
    }
    catch (error) {
        console.error('Fetch categories error:', error);
        return res.status(500).json({ message: 'Failed to retrieve categories' });
    }
});
// GET /:id - Get product details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_js_1.pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Fetch product by id error:', error);
        return res.status(500).json({ message: 'Failed to retrieve product details' });
    }
});
// ADMIN ONLY - POST / - Add new product
router.post('/', auth_js_1.adminMiddleware, async (req, res) => {
    const { title, description, price, image_url, category, stock } = req.body;
    if (!title || !description || price === undefined || !image_url || !category) {
        return res.status(400).json({ message: 'All fields (title, description, price, image_url, category) are required' });
    }
    try {
        const newProduct = await db_js_1.pool.query(`INSERT INTO products (title, description, price, image_url, category, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [title, description, parseFloat(price), image_url, category, stock !== undefined ? parseInt(stock) : 10]);
        return res.status(201).json(newProduct.rows[0]);
    }
    catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({ message: 'Failed to create product' });
    }
});
// ADMIN ONLY - PUT /:id - Edit existing product
router.put('/:id', auth_js_1.adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, description, price, image_url, category, stock } = req.body;
    if (!title || !description || price === undefined || !image_url || !category) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const checkResult = await db_js_1.pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const updatedProduct = await db_js_1.pool.query(`UPDATE products
       SET title = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6
       WHERE id = $7
       RETURNING *`, [title, description, parseFloat(price), image_url, category, stock !== undefined ? parseInt(stock) : 10, id]);
        return res.json(updatedProduct.rows[0]);
    }
    catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({ message: 'Failed to update product' });
    }
});
// ADMIN ONLY - DELETE /:id - Delete product
router.delete('/:id', auth_js_1.adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const checkResult = await db_js_1.pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await db_js_1.pool.query('DELETE FROM products WHERE id = $1', [id]);
        return res.json({ message: 'Product deleted successfully', id: parseInt(id) });
    }
    catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ message: 'Failed to delete product' });
    }
});
exports.default = router;
