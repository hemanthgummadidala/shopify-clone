import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { useRouter } from '../components/Router.js';
import { trackBeginCheckout, trackPurchase } from '../services/analytics.js';
import { CheckCircle2, ChevronRight, Lock, MapPin, Truck, HelpCircle, ArrowRight } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();
  const { navigate } = useRouter();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [error, setError] = useState('');

  // Track begin_checkout event on mount
  useEffect(() => {
    if (cart.length > 0) {
      trackBeginCheckout(cart, totalPrice);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please log in to complete your checkout');
      return;
    }

    if (!name || !address || !city || !postal) {
      setError('Please fill in all shipping details');
      return;
    }

    setSubmitting(true);

    try {
      // Format items array for API
      const itemsPayload = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: itemsPayload,
          shipping_name: name,
          shipping_address: address,
          shipping_city: city,
          shipping_postal: postal
        })
      });

      // Track GA4 purchase event
      trackPurchase(response.id.toString(), cart, parseFloat(response.total_amount));

      setSuccessOrder(response);
      await clearCart(); // Clear local/DB cart
    } catch (err: any) {
      setError(err.message || 'Checkout transaction failed. Please check your stock or values.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. If not authenticated, prompt sign-in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-xl border border-gray-100">
        <Lock className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900">Sign in to checkout</h2>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          You need an account to place orders, track shipments, and sync your shopping cart.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="mt-8 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  // 2. If Cart is empty and we haven't successfully checked out yet
  if (cart.length === 0 && !successOrder) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-xl border border-gray-100">
        <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900">Empty cart</h2>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Your cart is currently empty. You must add items before checking out.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
        >
          Browse Products
        </button>
      </div>
    );
  }

  // 3. Success State
  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 sm:p-10 text-center bg-white rounded-[35px] border border-gray-100 shadow-2xl space-y-6">
        <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-sm text-gray-500">
            Thank you for your purchase. We've sent a receipt to <span className="font-semibold text-gray-800">{user.email}</span>.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3 text-left text-sm max-w-md mx-auto">
          <div className="flex justify-between border-b border-gray-200/50 pb-2">
            <span className="text-gray-400 font-semibold">Order ID:</span>
            <span className="font-extrabold text-gray-800">#{successOrder.id}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200/50 pb-2">
            <span className="text-gray-400 font-semibold">Payment Status:</span>
            <span className="text-indigo-600 font-bold uppercase tracking-wider text-xs bg-indigo-50 px-2 py-0.5 rounded">
              Paid (Mock)
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200/50 pb-2">
            <span className="text-gray-400 font-semibold">Shipping Address:</span>
            <span className="font-semibold text-gray-800 text-right">{successOrder.shipping_address}, {successOrder.shipping_city}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-400 font-semibold">Amount Charged:</span>
            <span className="font-extrabold text-indigo-600 text-base">₹{parseFloat(successOrder.total_amount).toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            Track Order History
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 4. Normal Checkout Form Page
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Breadcrumb style path indicator */}
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-8">
        <span>Shopping Cart</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="text-indigo-600">Checkout Detail</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span>Confirmation</span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-semibold max-w-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Form (8 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Shipping Address Pane */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-50 pb-4">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="123 Luxury Avenue, Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Shipping Method Pane */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-50 pb-4">
              <Truck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Delivery Method</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center space-x-3">
                <input type="radio" checked readOnly className="h-4.5 w-4.5 text-indigo-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Premium Standard Delivery</span>
                  <span className="text-xs text-gray-500">Delivered within 3 - 5 business days</span>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-600 uppercase tracking-wider">Free</span>
            </div>
          </div>

        </form>

        {/* Right Column: Checkout Cart Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">
            Order Items
          </h2>

          {/* Items mini list */}
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-gray-50 bg-gray-50 shrink-0">
                  <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{item.product_title}</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ₹{(item.product_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3.5 text-sm border-t border-gray-50 pt-6">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping cost</span>
              <span className="text-emerald-600 font-semibold">Free</span>
            </div>
            <div className="border-t border-gray-50 pt-4 flex justify-between text-base font-bold text-gray-900">
              <span>Total Price</span>
              <span className="text-xl font-extrabold text-indigo-600">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing Transaction...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5">
                <Lock className="h-4.5 w-4.5" />
                <span>Complete Purchase (₹{totalPrice.toFixed(2)})</span>
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
