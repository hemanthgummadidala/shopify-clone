import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useRouter } from '../components/Router.js';
import { ShoppingBag, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, register, loading } = useAuth();
  const { navigate } = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await register(name, email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-gray-50 via-gray-100 to-indigo-50/50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-300">
        
        {/* Logo / Branding */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin ? 'Sign in to access your dashboard' : 'Join us to start shopping and tracking orders'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mt-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`w-1/2 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              isLogin ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`w-1/2 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              !isLogin ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-sm font-medium animate-pulse">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </div>
        </form>

        {isLogin && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
              Quick Demo Sign In
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Shopify Admin', email: 'admin@shopify.com', password: 'adminpassword', role: 'Admin', color: 'indigo' },
                { name: 'Sarah Connor', email: 'admin2@shopify.com', password: 'adminpassword', role: 'Admin', color: 'indigo' },
                { name: 'John Doe', email: 'user@shopify.com', password: 'userpassword', role: 'Customer', color: 'emerald' },
                { name: 'Jane Smith', email: 'customer2@shopify.com', password: 'customerpassword', role: 'Customer', color: 'emerald' }
              ].map((profile) => (
                <button
                  key={profile.email}
                  type="button"
                  onClick={async () => {
                    setEmail(profile.email);
                    setPassword(profile.password);
                    setError('');
                    try {
                      await login(profile.email, profile.password);
                      navigate('/');
                    } catch (err: any) {
                      setError(err.message || 'Authentication failed');
                    }
                  }}
                  className="flex flex-col items-start p-3.5 text-left border border-gray-100 hover:border-indigo-200 rounded-2xl hover:bg-indigo-50/10 transition-all duration-200 cursor-pointer hover:shadow-sm group"
                >
                  <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                    {profile.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {profile.email}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold mt-2.5 ${
                    profile.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {profile.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
