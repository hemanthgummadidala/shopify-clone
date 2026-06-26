import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import trackingRoutes from './routes/trackingRoute';
import scoringEngineRoutes from './routes/scoringEngine';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
// Change these two lines to separate their paths:
app.use('/api/analytics/tracking', trackingRoutes);
app.use('/api/analytics/scores', scoringEngineRoutes);

// Base API Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: "Shopify Clone Backend API is Live and Running!" });
});

// App Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Start database and server
async function startServer() {
  try {
    await initDatabase();
  } catch (error) {
    console.warn('⚠️ Database initialization failed. Backend will continue in fallback mode.', (error as Error)?.message || error);
  }

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` 🚀 Shopify Clone Backend running on port ${PORT}`);
    console.log(` 🟢 API Base: http://localhost:${PORT}`);
    console.log(` 🟢 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===================================================`);
  });
}

startServer();