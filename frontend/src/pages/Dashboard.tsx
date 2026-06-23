import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext.js';
import { useRouter } from '../components/Router.js';
import { Order, Product } from '../types.js';
import { User, ShoppingBag, Eye, Calendar, Package, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { navigate } = useRouter();

  // Dashboard state
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Profile Settings form demonstration
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [name, setName] = useState(user?.name || '');
  const [settingsSuccess, setSettingsSuccess] = useState<string>('');
  const [intentScore, setIntentScore] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [useAI, setUseAI] = useState<boolean>(false);

  const loadSessionAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      let currentSessionId = localStorage.getItem('shopify_session_id') || localStorage.getItem('ga4_session_id');
      if (!currentSessionId && user) {
        currentSessionId = `ga4_sid_${user.id}`;
      }

      if (!currentSessionId) {
        return;
      }

      const path = useAI ? '/analytics/analyze/ai' : '/analytics/analyze';
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: currentSessionId })
      });

      if (res.ok) {
        const data = await res.json();
        setIntentScore(data.intentScore);
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to communicate with the session analytics engine:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchOrderHistory = async () => {
      setLoadingOrders(true);
      try {
        const history = await apiFetch('/orders/history');
        setOrders(history);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    const loadRecentlyViewed = async () => {
      const viewedStr = localStorage.getItem('shopify_recently_viewed');
      if (viewedStr) {
        try {
          const viewedIds: number[] = JSON.parse(viewedStr);
          if (viewedIds.length === 0) return;

          // Fetch all products and filter for viewed ones to avoid multiple parallel API requests
          const res = await fetch(`${API_BASE}/products`);
          if (res.ok) {
            const allProducts: Product[] = await res.json();
            // Filter and preserve order of recently viewed list
            const filtered = viewedIds
              .map(id => allProducts.find(p => p.id === id))
              .filter((p): p is Product => !!p);
            setRecentlyViewed(filtered);
          }
        } catch (error) {
          console.error('Failed to load recently viewed:', error);
        }
      }
    };

    fetchOrderHistory();
    loadRecentlyViewed();
    loadSessionAnalytics();
  }, [user, useAI]);

  const toggleOrder = (orderId: number) => {
    setExpandedOrder(prev => (prev === orderId ? null : orderId));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('Profile updated successfully (Mock demonstration)');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  if (!user) {
    return null; // Redirect is handled in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">


      {/* Top Banner - Welcome User */}
      <section className="bg-gradient-to-tr from-gray-900 via-indigo-950 to-indigo-900 rounded-[35px] text-white p-8 sm:p-12 shadow-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center space-x-5">
          <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <User className="h-8 w-8 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-sm text-indigo-200 mt-1">{user.email} • Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'recent'}</p>
          </div>
        </div>

        <span className="self-start md:self-center px-4 py-1.5 bg-indigo-500/25 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300">
          Account Status: Active
        </span>
      </section>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-slate-700">
          Analytics mode: <span className="font-semibold">{useAI ? 'AI-enhanced summary' : 'Heuristic analysis'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUseAI(prev => !prev)}
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition"
          >
            Switch to {useAI ? 'Heuristic' : 'AI'}
          </button>
          <button
            type="button"
            onClick={loadSessionAnalytics}
            className="px-4 py-2 rounded-2xl bg-white border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide hover:bg-indigo-50 transition"
          >
            Refresh analytics
          </button>
        </div>
      </div>

      {loadingAnalytics ? (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-[24px] flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white font-bold text-xs">⏳</div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600">Session analytics</span>
              <p className="text-sm font-semibold text-slate-800 italic mt-0.5">Analyzing your session activity and calculating intent score…</p>
            </div>
          </div>
        </div>
      ) : aiSummary ? (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white font-bold text-xs">✨</div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600">Personalized Session Update</span>
              <p className="text-sm font-semibold text-slate-800 italic mt-0.5">
                "{aiSummary}"
              </p>
            </div>
          </div>
          
          {intentScore !== null && (
            <div className="bg-white px-4 py-2 rounded-xl border border-indigo-100 text-right min-w-[120px]">
              <span className="text-[9px] font-black tracking-wider uppercase text-indigo-500 block">Intent Score</span>
              <div className="text-2xl font-black text-slate-800 mt-0.5">{intentScore}/100</div>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar (1 col) */}
        <div className="flex flex-col space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-2xl cursor-pointer transition-all flex items-center space-x-2.5 ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100/50'
            }`}
          >
            <Package className="h-4.5 w-4.5" />
            <span>Order History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-2xl cursor-pointer transition-all flex items-center space-x-2.5 ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100/50'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Content Area (3 cols) */}
        <div className="lg:col-span-3 space-y-10">
          
          {activeTab === 'orders' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Your Orders</h2>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600"></div>
                  <p className="text-xs text-gray-400 font-semibold">Retrieving invoices...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <ShoppingBag className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <h4 className="text-base font-bold text-gray-900">No orders placed yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    You haven't purchased anything yet. Browse our storefront to find items you like.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div
                        key={order.id}
                        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                          isExpanded ? 'border-indigo-100 shadow-md shadow-indigo-50/20' : 'border-gray-100'
                        }`}
                      >
                        {/* Order Header Summary */}
                        <div
                          onClick={() => toggleOrder(order.id)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-all gap-4"
                        >
                          <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Order ID</span>
                              <span className="text-sm font-bold text-gray-900">#{order.id}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Placed Date</span>
                              <span className="text-sm font-semibold text-gray-700">{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Paid</span>
                              <span className="text-sm font-extrabold text-indigo-600">₹{parseFloat(order.total_amount as any).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 self-end sm:self-center text-xs font-bold text-indigo-600">
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>

                        {/* Order Details Items */}
                        {isExpanded && (
                          <div className="p-5 border-t border-gray-100 bg-white space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items in Order</h4>
                            <div className="divide-y divide-gray-50">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                  <div className="flex items-center space-x-3.5">
                                    <div className="h-10 w-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                      <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-gray-900">{item.product_title}</h5>
                                      <p className="text-xs text-gray-400 font-semibold mt-0.5">Quantity: {item.quantity} @ ₹{parseFloat(item.price as any).toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-gray-800">
                                    ₹{(parseFloat(item.price as any) * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2 mt-4">
                              <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Shipping Details</p>
                              <p className="font-semibold text-gray-700"><span className="text-gray-400">Recipient:</span> {order.shipping_name}</p>
                              <p className="font-semibold text-gray-700"><span className="text-gray-400">Address:</span> {order.shipping_address}, {order.shipping_city}, {order.shipping_postal}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Account Settings</h2>

              {settingsSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl">
                  {settingsSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full px-4 py-3 border border-gray-100 bg-gray-50/80 rounded-xl text-gray-400 text-sm cursor-not-allowed"
                    title="Email address cannot be changed"
                  />
                  <span className="text-[10px] text-gray-400 flex items-center space-x-1 mt-1">
                    <Lock className="h-3 w-3" />
                    <span>Email changes are disabled for security</span>
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recently Viewed Products Section */}
          {recentlyViewed.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Recently Viewed Products</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {recentlyViewed.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group border border-gray-50 rounded-2xl p-3 bg-gray-50/50 hover:bg-white hover:border-indigo-100 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-50/20"
                  >
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                    </div>
                    <h4 className="text-xs font-extrabold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{product.title}</h4>
                    <p className="text-xs font-extrabold text-indigo-600 mt-1">₹{parseFloat(product.price as any).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
