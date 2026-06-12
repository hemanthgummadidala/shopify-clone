"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./db.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const products_js_1 = __importDefault(require("./routes/products.js"));
const orders_js_1 = __importDefault(require("./routes/orders.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes mapping
app.use('/api/auth', auth_js_1.default);
app.use('/api/products', products_js_1.default);
app.use('/api/orders', orders_js_1.default);
app.use('/api/admin', admin_js_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
// Start database and server
async function startServer() {
    await (0, db_js_1.initDatabase)();
    app.listen(PORT, () => {
        console.log(`===================================================`);
        console.log(` Shopify Clone Backend running on port ${PORT}`);
        console.log(` Health check: http://localhost:${PORT}/api/health`);
        console.log(`===================================================`);
    });
}
startServer().catch((error) => {
    console.error('Server startup failed:', error);
});
// Trigger reload
