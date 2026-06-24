import { Router, Response } from 'express';
import { pool } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ==========================================
// CART MANAGEMENT ENDPOINTS (DATABASE BACKED)
// ==========================================

// GET /orders/cart - Get user's cart items
router.get('/cart', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.product_id, c.quantity, p.title as product_title, p.price as product_price, p.image_url as product_image
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user!.id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Fetch cart error:', error);
    return res.status(500).json({ message: 'Failed to retrieve cart items' });
  }
});

// POST /orders/cart - Upsert item in user's cart
router.post('/cart', authMiddleware, async (req: AuthRequest, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || quantity === undefined) {
    return res.status(400).json({ message: 'Product ID and quantity are required' });
  }

  try {
    // Check if product exists and stock is sufficient
    const productCheck = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity <= 0) {
      // Delete if quantity is set to 0 or negative
      await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user!.id, product_id]);
      return res.json({ message: 'Item removed from cart' });
    }

    // Upsert query
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = $3`,
      [req.user!.id, product_id, quantity]
    );

    // Fetch updated cart items list
    const updatedCart = await pool.query(
      `SELECT c.id, c.product_id, c.quantity, p.title as product_title, p.price as product_price, p.image_url as product_image
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user!.id]
    );

    return res.json(updatedCart.rows);
  } catch (error) {
    console.error('Upsert cart error:', error);
    return res.status(500).json({ message: 'Failed to update cart' });
  }
});

// DELETE /orders/cart/:productId - Delete item from user's cart
router.delete('/cart/:productId', authMiddleware, async (req: AuthRequest, res) => {
  const { productId } = req.params;
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user!.id, productId]);
    return res.json({ message: 'Item deleted from cart', product_id: parseInt(productId) });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return res.status(500).json({ message: 'Failed to delete cart item' });
  }
});

// ==========================================
// ORDER CHECKOUT AND HISTORY ENDPOINTS
// ==========================================

// POST /orders - Create new order (Checkout)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { items, shipping_name, shipping_address, shipping_city, shipping_postal } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required for checkout' });
  }

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_postal) {
    return res.status(400).json({ message: 'Shipping details (name, address, city, postal) are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start SQL Transaction

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // Verify stock and calculate total price
    for (const item of items) {
      const productResult = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      const product = productResult.rows[0];
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}`);
      }

      const price = parseFloat(product.price);
      totalAmount += price * item.quantity;

      orderItemsToInsert.push({
        product_id: product.id,
        quantity: item.quantity,
        price: price
      });
    }

    // 1. Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_address, shipping_city, shipping_postal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user!.id, totalAmount, 'pending', shipping_name, shipping_address, shipping_city, shipping_postal]
    );
    const newOrder = orderResult.rows[0];

    // 2. Insert order items and deduct stock
    for (const item of orderItemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [newOrder.id, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 3. Clear database cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);

    await client.query('COMMIT'); // Commit transaction
    return res.status(201).json(newOrder);

  } catch (error: any) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Checkout error:', error.message);
    return res.status(400).json({ message: error.message || 'Checkout failed' });
  } finally {
    client.release();
  }
});

// GET /orders/history - Get order history of logged-in user
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC',
      [req.user!.id]
    );

    const orders = ordersResult.rows;

    // Fetch items for each order
    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT o.id, o.product_id, o.quantity, o.price, p.title as product_title, p.image_url as product_image
         FROM order_items o
         JOIN products p ON o.product_id = p.id
         WHERE o.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    return res.json(orders);
  } catch (error) {
    console.error('Fetch order history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve order history' });
  }
});

export default router;
