export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  created_at?: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_title: string;
  product_image: string;
}

export interface CartItem {
  id?: number;
  product_id: number;
  quantity: number;
  product_title: string;
  product_price: number;
  product_image: string;
}
