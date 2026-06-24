import { Router, Response } from 'express';
import { pool } from '../db.js';
import { adminMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /admin/stats - Admin Dashboard Statistics
router.get('/stats', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    // 1. Total Sales & Total Orders
    const salesResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as total_orders
      FROM orders
    `);

    // 2. Total Products
    const productsResult = await pool.query('SELECT COUNT(id) as total_products FROM products');

    // 3. Total Users
    const usersResult = await pool.query('SELECT COUNT(id) as total_users FROM users');

    // 4. Sales by Status
    const statusResult = await pool.query(`
      SELECT status, COUNT(id) as count, COALESCE(SUM(total_amount), 0) as amount
      FROM orders
      GROUP BY status
    `);

    // 5. Recent Orders
    const recentOrdersResult = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
      LIMIT 5
    `);

    return res.json({
      summary: {
        totalSales: parseFloat(salesResult.rows[0].total_sales),
        totalOrders: parseInt(salesResult.rows[0].total_orders),
        totalProducts: parseInt(productsResult.rows[0].total_products),
        totalUsers: parseInt(usersResult.rows[0].total_users),
      },
      statusSummary: statusResult.rows,
      recentOrders: recentOrdersResult.rows
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({ message: 'Failed to load dashboard statistics' });
  }
});

// GET /admin/users - Admin User List (with order counts)
router.get('/users', adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

// DELETE /admin/users/:id - Delete a user (Admin only)
router.delete('/users/:id', adminMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    // Check if user exists
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (parseInt(id) === req.user!.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return res.json({ message: 'User deleted successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
