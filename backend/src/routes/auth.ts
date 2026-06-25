import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { BigQuery } from '@google-cloud/bigquery';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_shopify_key';

// 🔐 Initialize BigQuery client pointing directly to your credentials
const bqClient = new BigQuery({
  keyFilename: 'gcp-service-account-key.json',
  projectId: 'shopify-clone-499604'
});

// POST /register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email.toLowerCase(), hashedPassword]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({ token, user: newUser.rows[0] });
  } catch (error) {
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
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // 📡 DYNAMIC RETENTION TRACKING: Fetch past interactions from BigQuery
    let showPopup = false;
    let abandonedProduct = null;

    try {
      const bqQuery = `
        SELECT 
          event_name,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') as item_name
        FROM \`shopify-clone-499604.analytics_541293436.events_20260616\`
        WHERE user_id = @email OR (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'user_email') = @email
        ORDER BY event_timestamp DESC
        LIMIT 10
      `;

      const [rows] = await bqClient.query({
        query: bqQuery,
        params: { email: email.toLowerCase() }
      });

      const completedPurchase = rows.some(r => r.event_name === 'purchase');
      if (!completedPurchase && rows.length > 0) {
        const lastView = rows.find(r => r.event_name === 'view_item' || r.event_name === 'add_to_cart');
        if (lastView && lastView.item_name) {
          showPopup = true;
          abandonedProduct = lastView.item_name;
        }
      }
    } catch (bqErr) {
      console.error("BigQuery query failed:", bqErr);
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        showPopup,
        abandonedProduct
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;