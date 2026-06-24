import React, { useState, useEffect } from 'react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { useRouter } from '../components/Router.js';
import { trackViewItem } from '../services/analytics.js';
import { useAuth, API_BASE } from '../context/AuthContext.js'; // Combining useAuth and API_BASE here!
import { ChevronLeft, ShoppingCart, Star, ShieldCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { path, navigate } = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [addedMessage, setAddedMessage] = useState<boolean>(false);

  // Extract ID from path like /products/5
  const pathParts = path.split('?')[0].split('/');
  const productId = parseInt(pathParts[pathParts.length - 1]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        setProduct(data);

        // Track GA4 view_item event
        trackViewItem({
          id: data.id,
          title: data.title,
          price: parseFloat(data.price),
          category: data.category
        });

        // 🔥 NEW CORE TELEMETRY: Fire tracking action straight into PostgreSQL database
        // Replace 'user?.id' or '2' with your active application state variable
        const activeUserId = localStorage.getItem('shopify_user_id') || '2'; 
        
        fetch(`${API_BASE}/track/track-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: parseInt(activeUserId), 
            actionName: 'view_item' 
          })
        }).catch(err => console.error("Telemetry failed to send:", err));

        // Track recently viewed products in local storage
        const viewedStr = localStorage.getItem('shopify_recently_viewed');
        let viewedList: number[] = viewedStr ? JSON.parse(viewedStr) : [];
        viewedList = viewedList.filter(id => id !== data.id);
        viewedList.unshift(data.id);
        viewedList = viewedList.slice(0, 4); // Keep last 4
        localStorage.setItem('shopify_recently_viewed', JSON.stringify(viewedList));

      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  async function handleAddToCart() {
    if (!product) return;
    await addToCart(product, quantity);

    // Track GA4 add_to_cart event is now handled globally in CartContext.tsx

    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  }

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600"></div>
        <p className="text-sm text-gray-500 font-medium">Inspecting creation details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border border-gray-100">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Oops! Product not found</h3>
        <p className="mt-2 text-sm text-gray-500">{error || 'This product does not exist or was deleted.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-8 cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Image */}
        <div className="bg-gray-50 rounded-[35px] overflow-hidden border border-gray-100 shadow-sm aspect-square max-h-[550px]">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Column: Information */}
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2">
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
              {product.category}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {product.title}
          </h1>

          {/* Reviews Rating summary */}
          <div className="flex items-center space-x-2 mt-3.5">
            <div className="flex items-center space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">4.9</span>
            <span className="text-sm text-gray-400 font-medium">(12 verified buyer reviews)</span>
          </div>

          {/* Pricing */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Single Price</span>
              <span className="text-3xl font-extrabold text-gray-900">
                ₹{parseFloat(product.price as any).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Overview</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity selector and Cart controls */}
          {product.stock > 0 ? (
            <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-all text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-5 text-sm font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-all text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-grow flex flex-col justify-end pt-5">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Add to Shopping Cart</span>
                  </button>
                </div>
              </div>

              {addedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-xl text-center animate-fade-in-down">
                  Added to shopping cart!
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm text-center">
              This product is temporarily out of stock. Check back soon!
            </div>
          )}

          {/* E-Commerce trust factors */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <div className="flex flex-col items-center">
              <Truck className="h-5 w-5 text-indigo-500 mb-1.5" />
              <span>Free Delivery</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="h-5 w-5 text-indigo-500 mb-1.5" />
              <span>2-Year Warranty</span>
            </div>
            <div className="flex flex-col items-center">
              <RefreshCw className="h-5 w-5 text-indigo-500 mb-1.5" />
              <span>30-Day Returns</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
