import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext.js';
import { useRouter } from '../components/Router.js';
import { Product, User as UserType } from '../types.js';
import { DollarSign, ShoppingBag, Users, Package, Plus, Edit, Trash2, X, Lock, CheckCircle, BarChart3 } from 'lucide-react';

interface Stats {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
  };
  recentOrders: Array<{
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
    user_name: string;
    user_email: string;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { navigate } = useRouter();

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'users'>('stats');

  // API Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modals / Forms States
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [modalImage, setModalImage] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalStock, setModalStock] = useState('10');
  const [modalError, setModalError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError('');
    try {
      // Fetch stats
      const statsData = await apiFetch('/admin/stats');
      setStats(statsData);

      // Fetch products (raw public listing is fine, but ordering it is handled)
      const productsData = await apiFetch('/products');
      setProducts(productsData);

      // Fetch users
      const usersData = await apiFetch('/admin/users');
      setUsersList(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'admin') {
      return; // Handled in render
    }
    loadData();
  }, [user]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setModalTitle('');
    setModalDesc('');
    setModalPrice('');
    setModalImage('');
    setModalCategory('');
    setModalStock('10');
    setModalError('');
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setModalTitle(p.title);
    setModalDesc(p.description);
    setModalPrice(p.price.toString());
    setModalImage(p.image_url);
    setModalCategory(p.category);
    setModalStock(p.stock.toString());
    setModalError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalTitle || !modalDesc || !modalPrice || !modalImage || !modalCategory) {
      setModalError('Please fill in all required fields');
      return;
    }

    const payload = {
      title: modalTitle,
      description: modalDesc,
      price: parseFloat(modalPrice),
      image_url: modalImage,
      category: modalCategory,
      stock: parseInt(modalStock)
    };

    try {
      if (editingProduct) {
        // Edit existing product
        const updated = await apiFetch(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
        showNotification('Product updated successfully');
      } else {
        // Add new product
        const created = await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setProducts(prev => [created, ...prev]);
        showNotification('Product created successfully');
      }
      setShowProductModal(false);
      // reload stats
      const statsData = await apiFetch('/admin/stats');
      setStats(statsData);
    } catch (err: any) {
      setModalError(err.message || 'Operation failed');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await apiFetch(`/products/${productId}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== productId));
      showNotification('Product deleted successfully');
      // reload stats
      const statsData = await apiFetch('/admin/stats');
      setStats(statsData);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this customer account? All associated orders will also be deleted.')) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsersList(prev => prev.filter(u => u.id !== userId));
      showNotification('User deleted successfully');
      // reload stats
      const statsData = await apiFetch('/admin/stats');
      setStats(statsData);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // 1. Guard check for unauthorized roles
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-xl border border-gray-100">
        <Lock className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900">Access Denied</h2>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          You do not have administrative privileges to view this page. If you believe this is an error, please contact your database administrator.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopify Control Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage store inventory, customers, and view reports</p>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold animate-bounce shadow-sm">
            <CheckCircle className="h-4 w-4" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Package className="h-4.5 w-4.5" />
          <span>Inventory Panel ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer shrink-0 ${
            activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          <span>Customer Management ({usersList.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600"></div>
          <p className="text-sm text-gray-500 font-medium">Aggregating records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl text-center font-medium max-w-md mx-auto">
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: STATISTICS OVERVIEW */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-10">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Sales */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Sales</span>
                    <span className="text-2xl font-extrabold text-gray-900">₹{stats.summary.totalSales.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
                    <span className="text-2xl font-extrabold text-gray-900">{stats.summary.totalOrders}</span>
                  </div>
                </div>

                {/* Total Products */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Products</span>
                    <span className="text-2xl font-extrabold text-gray-900">{stats.summary.totalProducts}</span>
                  </div>
                </div>

                {/* Total Users */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-5">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Customers</span>
                    <span className="text-2xl font-extrabold text-gray-900">{stats.summary.totalUsers}</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Customer Checkout Actions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Order</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Total Paid</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-bold text-gray-900">#{order.id}</td>
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{order.user_name}</span>
                              <span className="text-xs text-gray-400">{order.user_email}</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="py-4 font-bold text-gray-900">₹{parseFloat(order.total_amount as any).toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {stats.recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">No recent orders registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Store Catalog Inventory</h3>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products list table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Product</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                              <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-gray-900 line-clamp-1">{p.title}</span>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-gray-500">{p.category}</td>
                        <td className="py-4 font-bold text-gray-900">₹{parseFloat(p.price as any).toFixed(2)}</td>
                        <td className="py-4">
                          <span className={`font-semibold ${p.stock < 5 ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Customer Accounts</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">User Details</th>
                      <th className="pb-3 font-semibold">Registered</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Total Orders</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{u.name}</span>
                            <span className="text-xs text-gray-400">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-gray-900">{(u as any).order_count}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === 'admin'}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.role === 'admin' ? 'Cannot delete admin' : 'Delete User'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-[30px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? `Edit ${editingProduct.title}` : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-grow">
              {modalError && (
                <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  placeholder="e.g. Premium Wool Coat"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  required
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  rows={3}
                  className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm resize-none"
                  placeholder="Describe your creation's features and materials..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="e.g. 99.99"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock count</label>
                  <input
                    type="number"
                    required
                    value={modalStock}
                    onChange={(e) => setModalStock(e.target.value)}
                    className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  placeholder="e.g. Apparel, Accessories, Kitchen"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Image URL *</label>
                <input
                  type="text"
                  required
                  value={modalImage}
                  onChange={(e) => setModalImage(e.target.value)}
                  className="block w-full px-4.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none text-sm"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
