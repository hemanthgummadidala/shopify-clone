import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { Link, useRouter } from './Router.js';
import { ShoppingBag, ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, Search, Menu, X } from 'lucide-react';
import { trackSearch } from '../services/analytics.js';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      trackSearch(query);
      navigate(`/?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 glass-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ShoppingBag className="h-5.5 w-5.5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              Shopify<span className="text-indigo-600 font-medium">Clone</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-md w-full relative">
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm py-2.5 pl-10 pr-4 rounded-2xl transition-all"
            />
            <span className="absolute left-3.5 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <button type="submit" className="hidden">Search</button>
          </form>

          {/* Navigation Items (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center space-x-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-1.5 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.name.split(' ')[0]}'s Account</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center space-x-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 px-4 py-2 rounded-2xl transition-all">
                <UserIcon className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2.5 bg-gray-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md shadow-gray-200 active:scale-95 flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex items-center lg:hidden gap-3">
            {/* Cart Icon Mobile */}
            <Link
              to="/cart"
              className="relative p-2.5 bg-gray-900 text-white rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 pt-4 pb-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:outline-none py-2.5 pl-10 pr-4 rounded-xl text-sm"
            />
            <span className="absolute left-3.5 top-3.5 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
          </form>

          <div className="flex flex-col space-y-3 font-medium text-sm text-gray-700">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-gray-50 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-gray-50 text-indigo-600 font-bold flex items-center space-x-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-gray-50 flex items-center space-x-1.5"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>My Account ({user.name})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-rose-600 flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 px-4 rounded-xl flex items-center justify-center space-x-1.5 text-center font-semibold"
              >
                <UserIcon className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
