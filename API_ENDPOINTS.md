# Shopify Clone API Endpoints

All endpoints are now served from: `https://shopify-clone-nu.vercel.app/api/`

## Health Check
- `GET /` - Service health status
- `GET /api/health` - API health endpoint

## Authentication (`/api/auth`)
- `POST /auth/register` - Register new user
  - Body: `{ email, password, name }`
  - Returns: `{ token, user }`

- `POST /auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `GET /auth/me` - Get current user profile
  - Requires: Bearer token in Authorization header
  - Returns: User object with id, email, name, role, created_at

## Products (`/api/products`)
- `GET /products` - List all products with optional filtering
  - Query params: `search`, `category`
  - Returns: Array of products

- `GET /products/categories` - Get list of product categories
  - Returns: Array of category names

- `GET /products/:id` - Get single product details
  - Returns: Product object

- `POST /products` - Create new product (Admin only)
  - Headers: Bearer token required, user must be admin
  - Body: `{ title, description, price, image_url, category, stock }`
  - Returns: Created product

- `PUT /products/:id` - Update product (Admin only)
  - Headers: Bearer token required, user must be admin
  - Body: `{ title, description, price, image_url, category, stock }`
  - Returns: Updated product

- `DELETE /products/:id` - Delete product (Admin only)
  - Headers: Bearer token required, user must be admin
  - Returns: `{ message, id }`

## Orders (`/api/orders`)
### Cart Management
- `GET /orders/cart` - Get user's cart items
  - Headers: Bearer token required
  - Returns: Array of cart items with product details

- `POST /orders/cart` - Add/update item in cart
  - Headers: Bearer token required
  - Body: `{ product_id, quantity }`
  - Returns: Updated cart items

- `DELETE /orders/cart/:productId` - Remove item from cart
  - Headers: Bearer token required
  - Returns: `{ message, product_id }`

### Checkout & Orders
- `POST /orders` - Create new order from cart
  - Headers: Bearer token required
  - Body: `{ items, shipping_name, shipping_address, shipping_city, shipping_postal }`
  - Returns: Created order object

- `GET /orders/history` - Get user's order history
  - Headers: Bearer token required
  - Returns: Array of orders with items details

## Admin (`/api/admin`)
- `GET /admin/stats` - Get dashboard statistics (Admin only)
  - Headers: Bearer token required, user must be admin
  - Returns: `{ summary, statusSummary, recentOrders }`

- `GET /admin/users` - Get all users list (Admin only)
  - Headers: Bearer token required, user must be admin
  - Returns: Array of users with order counts

- `DELETE /admin/users/:id` - Delete user account (Admin only)
  - Headers: Bearer token required, user must be admin
  - Returns: `{ message, id }`

## Analytics (`/api/analytics`)
- `POST /analytics/track-action` - Track user action
  - Body: `{ userId, actionName }`
  - Returns: `{ success, message }`
  - Note: Appends action to user's action_history

- `POST /analytics/analyze` - Analyze session with heuristic scoring
  - Body: `{ sessionId }`
  - Returns: `{ success, intentScore, summary }`
  - Note: intentScore is 0-100

- `POST /analytics/analyze/ai` - Analyze session with AI (requires OPENAI_API_KEY)
  - Body: `{ sessionId }`
  - Returns: `{ success, intentScore, summary }`
  - Falls back to heuristic if API key is missing

## Authentication Headers

For protected endpoints, include:
```
Authorization: Bearer <jwt_token>
```

## Response Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (missing fields, invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Error Response Format

```json
{
  "message": "Error description" | "error": "Error description"
}
```

## Example Requests

### Register User
```bash
curl -X POST https://shopify-clone-nu.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John Doe"}'
```

### Get Products
```bash
curl https://shopify-clone-nu.vercel.app/api/products
curl "https://shopify-clone-nu.vercel.app/api/products?category=Electronics"
curl "https://shopify-clone-nu.vercel.app/api/products?search=backpack"
```

### Analyze Session
```bash
curl -X POST https://shopify-clone-nu.vercel.app/api/analytics/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ga4_sid_12345"}'
```

### Add to Cart
```bash
curl -X POST https://shopify-clone-nu.vercel.app/api/orders/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"product_id":1,"quantity":2}'
```

## Database Schema

The API expects these PostgreSQL tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `orders` - User orders
- `order_items` - Items in each order
- `cart` - User shopping carts
- `tracking_logs` - Session tracking events

These are automatically created when the API initializes (see `db.ts` for schema).
