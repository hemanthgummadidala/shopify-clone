import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

// Connection string or credentials from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/shopify_clone';

export const pool = new Pool({
  connectionString,
  // If connectionString is empty, use individual env vars
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE || 'shopify_clone',
});

// Seed products data
const mockProducts = [
  {
    title: 'Sleek Leather Backpack',
    description: 'A premium, water-resistant leather backpack with a dedicated laptop compartment and multiple accessory pockets. Perfect for daily commutes and business travel.',
    price: 89.00,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Bags',
    stock: 25
  },
  {
    title: 'Wireless Noise-Cancelling Headphones',
    description: 'Immersive sound with hybrid active noise cancellation. Features Bluetooth 5.2, 40-hour battery life, and comfortable memory foam earcups.',
    price: 199.99,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Electronics',
    stock: 15
  },
  {
    title: 'Minimalist Quartz Watch',
    description: 'An elegant watch featuring a stainless steel case, sapphire glass, and a genuine leather strap. Water-resistant up to 50 meters.',
    price: 129.00,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Accessories',
    stock: 10
  },
  {
    title: 'Ergonomic Office Chair',
    description: 'Fully adjustable office chair with mesh back support, 3D armrests, and dynamic lumbar alignment for comfort during long working hours.',
    price: 249.50,
    image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Furniture',
    stock: 8
  },
  {
    title: 'Smart Fitness Tracker',
    description: 'Track your steps, heart rate, sleep patterns, and workouts. Features a vibrant AMOLED display, built-in GPS, and 7-day battery life.',
    price: 79.00,
    image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Electronics',
    stock: 30
  },
  {
    title: 'Organic Cotton Hoodie',
    description: 'Ultra-soft fleece hoodie made from 100% organic cotton. Relaxed fit, double-lined hood, and durable double-needle stitching.',
    price: 59.99,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Apparel',
    stock: 40
  },
  {
    title: 'Premium Pour-Over Coffee Maker',
    description: 'Brew professional barista-quality coffee at home. Set includes a heat-resistant borosilicate glass carafe and a reusable stainless steel mesh filter.',
    price: 45.00,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Kitchen',
    stock: 20
  },
  {
    title: 'Bamboo Fiber Dinnerware Set',
    description: 'Eco-friendly and durable 16-piece set including plates, bowls, and cups. Dishwasher safe, BPA-free, and biodegradable.',
    price: 34.99,
    image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Kitchen',
    stock: 18
  },
  {
    title: 'Minimalist Wood Desk Organizer',
    description: 'Keep your workspace tidy with this hand-crafted oak desk organizer. Features slots for pens, folders, and a dedicated smartphone holder with cable routing.',
    price: 39.00,
    image_url: 'https://images.unsplash.com/photo-1591123720164-de1348028a82?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Home Decor',
    stock: 12
  },
  {
    title: 'Adjustable Dumbbells Set',
    description: 'Compact adjustable dumbbell set ranging from 5 to 50 lbs. Steel core handles with durable non-slip grips. Includes space-saving storage trays.',
    price: 189.99,
    image_url: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Fitness',
    stock: 10
  },
  {
    title: 'Cast Iron Teapot Set',
    description: 'A traditional Japanese style cast iron teapot with two matching cups and a trivet. Features a fully enameled interior to prevent rust and preserve pure tea taste.',
    price: 48.99,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Kitchen',
    stock: 12
  },
  {
    title: 'Waterproof Trail Running Shoes',
    description: 'High-performance running shoes designed for rough terrain. Features waterproof breathable membranes, multi-directional lug outsoles, and cushioned midsoles.',
    price: 115.00,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Apparel',
    stock: 20
  },
  {
    title: 'Smart LED Desk Lamp',
    description: 'Modern desk lamp with auto-dimming sensor, adjustable color temperature (2700K-6500K), USB-C charging port, and full smart home integration.',
    price: 49.00,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Electronics',
    stock: 14
  },
  {
    title: 'Ceramic Indoor Plant Pots',
    description: 'Three-piece set of modern ceramic planters with drain holes and bamboo trays. Perfect for showcasing succulents, air plants, or home herbs.',
    price: 29.50,
    image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Home Decor',
    stock: 18
  },
  {
    title: 'Stainless Steel Water Bottle',
    description: 'Double-wall vacuum insulated water bottle. Keeps drinks cold for up to 24 hours or hot for 12. Durable powder-coated finish and leak-proof leak lid.',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Accessories',
    stock: 35
  },
  {
    title: 'Noise-Isolating Earbuds',
    description: 'Ergonomic in-ear wired earbuds with high-fidelity dynamic drivers. Crystal clear sound, inline microphone, and passive noise isolation.',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    category: 'Electronics',
    stock: 50
  }
];

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database...');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clean up duplicate products (keep the one with lowest ID)
    await client.query(`
      DELETE FROM products a 
      USING products b 
      WHERE a.id > b.id AND a.title = b.title;
    `);

    // Add unique constraint to title on existing schemas
    await client.query(`
      ALTER TABLE products 
      ADD CONSTRAINT products_title_key UNIQUE (title);
    `).catch(() => {
      // Ignore if constraint already exists
    });

    // 3. Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
        shipping_name VARCHAR(255) NOT NULL,
        shipping_address TEXT NOT NULL,
        shipping_city VARCHAR(100) NOT NULL,
        shipping_postal VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Order Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
    `);

    // 5. Cart Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        UNIQUE(user_id, product_id)
      );
    `);

    console.log('Database tables verified/created successfully.');

    // Seed Demo Users incrementally
    const usersToSeed = [
      { email: 'admin@shopify.com', password: 'adminpassword', name: 'Shopify Admin', role: 'admin' },
      { email: 'admin2@shopify.com', password: 'adminpassword', name: 'Sarah Connor', role: 'admin' },
      { email: 'user@shopify.com', password: 'userpassword', name: 'John Doe', role: 'user' },
      { email: 'customer2@shopify.com', password: 'customerpassword', name: 'Jane Smith', role: 'user' }
    ];

    for (const u of usersToSeed) {
      const userCheck = await client.query("SELECT * FROM users WHERE email = $1", [u.email]);
      if (userCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await client.query(`
          INSERT INTO users (email, password, name, role)
          VALUES ($1, $2, $3, $4)
        `, [u.email, hashedPassword, u.name, u.role]);
        console.log(`Demo user created: ${u.email} / ${u.password} (${u.role})`);
      }
    }

    // Remove outdated products
    await client.query("DELETE FROM products WHERE title = 'Double-Walled Glass Coffee Mugs'");

    // Check if high prices (USD * 83) are present in the database, and truncate to re-seed if so
    const maxPriceRes = await client.query("SELECT MAX(price) as max_price FROM products;");
    const maxPrice = parseFloat(maxPriceRes.rows[0].max_price || '0');
    if (maxPrice > 3000) {
      console.log('Detected high prices in database (USD * 83). Truncating tables to re-seed with affordable prices (USD * 10)...');
      await client.query("TRUNCATE TABLE products CASCADE;");
      await client.query("TRUNCATE TABLE orders CASCADE;");
    }

    // Migrate USD prices to affordable INR (if they are <= 300, multiply by 10)
    await client.query("UPDATE products SET price = price * 10 WHERE price <= 300;");
    await client.query("UPDATE orders SET total_amount = total_amount * 10 WHERE total_amount <= 1500;");
    await client.query("UPDATE order_items SET price = price * 10 WHERE price <= 300;");

    // Seed Products incrementally
    console.log('Verifying/Seeding mock products...');
    let seededCount = 0;
    for (const p of mockProducts) {
      const productCheck = await client.query("SELECT id FROM products WHERE title = $1", [p.title]);
      if (productCheck.rows.length === 0) {
        const inrPrice = parseFloat((p.price * 10).toFixed(2));
        await client.query(`
          INSERT INTO products (title, description, price, image_url, category, stock)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [p.title, p.description, inrPrice, p.image_url, p.category, p.stock]);
        seededCount++;
      }
    }
    if (seededCount > 0) {
      console.log(`${seededCount} new mock products seeded successfully.`);
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
    console.warn('\n>>> CAUTION: Please make sure your PostgreSQL database is running and configuration in .env is correct.\n');
  } finally {
    client.release();
  }
}
