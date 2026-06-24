import React from 'react';
import { useCart } from '../context/CartContext.js';
import { useRouter } from '../components/Router.js';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, loading } = useCart();
  const { navigate } = useRouter();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-20 px-4 py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-xl">
        <div className="h-16 w-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Your shopping cart is empty</h2>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Looks like you haven't added anything to your cart yet. Head back to the store and check out our premium collection.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-6 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-95"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        Your Cart <span className="text-gray-400 font-normal">({totalItems} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left 2 Columns: Items list */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center gap-4 sm:gap-6 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-indigo-100/70 transition-all duration-300"
            >
              {/* Product Image */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-50 shrink-0">
                <img
                  src={item.product_image}
                  alt={item.product_title}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Product Info */}
              <div className="flex-grow min-w-0 pr-6">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                  <a href={`/products/${item.product_id}`} onClick={(e) => { e.preventDefault(); navigate(`/products/${item.product_id}`); }}>
                    {item.product_title}
                  </a>
                </h3>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-indigo-600">
                  ₹{item.product_price.toFixed(2)}
                </p>

                {/* Mobile controls inside info */}
                <div className="flex items-center space-x-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    disabled={loading}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={loading}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Price & Delete Button */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                  title="Remove item"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <span className="text-sm sm:text-base font-extrabold text-gray-900">
                  ₹{(item.product_price * item.quantity).toFixed(2)}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className="text-emerald-600 font-semibold uppercase tracking-wider text-xs bg-emerald-50 px-2 py-0.5 rounded">
                Free
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Sales Tax</span>
              <span className="font-semibold text-gray-900">₹0.00</span>
            </div>
            <div className="border-t border-gray-50 pt-4 flex justify-between text-base font-bold text-gray-900">
              <span>Total Amount</span>
              <span className="text-xl font-extrabold text-indigo-600">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full group py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 pt-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>Secure 256-bit SSL Checkout</span>
          </div>
        </div>

      </div>
    </div>
  );
};
