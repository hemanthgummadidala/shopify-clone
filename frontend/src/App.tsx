import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, API_BASE, getUserPseudoId } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { RouterProvider, Route, useRouter } from './components/Router.js';
import { Header } from './components/Header.js';
import { Home } from './pages/Home.js';
import { Auth } from './pages/Auth.js';
import { ProductDetails } from './pages/ProductDetails.js';
import { Cart } from './pages/Cart.js';
import { Checkout } from './pages/Checkout.js';
import { Dashboard } from './pages/Dashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { ShoppingBag } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500 font-medium">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
          <span className="font-extrabold tracking-tight text-gray-900">
            Shopify<span className="text-indigo-600 font-medium">Clone</span>
          </span>
        </div>
        <p>© 2026 Shopify Clone Inc. Made with Antigravity AI Pair Programming.</p>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Support Contact</a>
        </div>
      </div>
    </footer>
  );
};

const AppContent: React.FC = () => {
  const { user, loading, pendingPopupCheck, clearPendingPopupCheck } = useAuth();
  const { path, navigate } = useRouter();

  // State to hold user intent popup configuration map
  const [popupData, setPopupData] = useState({ shouldShow: false, title: '', message: '', couponCode: '' });

  useEffect(() => {
    if (loading || !user || !pendingPopupCheck) return;

    const userPseudoId = getUserPseudoId(user.id);

    fetch(`${API_BASE}/tracking/user-popup-intent/${userPseudoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.popup && data.popup.shouldShow) {
          setPopupData(data.popup);
        }
      })
      .catch((err) => console.error('Landing user intent profile synchronization failure:', err))
      .finally(() => clearPendingPopupCheck());
  }, [user, loading, pendingPopupCheck, clearPendingPopupCheck]);
  useEffect(() => {
    const pathname = path.split('?')[0];
    if (!loading) {
      if (!user && pathname !== '/auth') {
        navigate('/auth');
      } else if (user && pathname === '/auth') {
        navigate('/');
      }
    }
  }, [user, loading, path]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfcfc] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Restoring secure session...</p>
      </div>
    );
  }

  // Render-time guard layout path configuration to block authentication flashes
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
        <Header />
        <main className="flex-grow">
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/products/:id" element={<Auth />} />
          <Route path="/cart" element={<Auth />} />
          <Route path="/checkout" element={<Auth />} />
          <Route path="/dashboard" element={<Auth />} />
          <Route path="/admin" element={<Auth />} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
      <Header />
      <main className="flex-grow">
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </main>
      <Footer />
      
      {/* Real-time Intent Targeted Popup Modal */}
      {popupData.shouldShow && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '12px', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 'bold', color: '#000' }}>{popupData.title}</h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>{popupData.message}</p>
            
            {popupData.couponCode && (
              <div style={{ border: '2px dashed #000', backgroundColor: '#f9fafb', padding: '12px', fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '24px', color: '#000' }}>
                {popupData.couponCode}
              </div>
            )}

            <button 
              onClick={() => setPopupData({ ...popupData, shouldShow: false })}
              style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
            >
              Claim Offer & Shop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;