import React, { useState, useEffect } from 'react';
import { Product } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';
import { useRouter } from '../components/Router.js';
import { API_BASE } from '../context/AuthContext.js';
import { ArrowRight, HelpCircle, Layers, SlidersHorizontal, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  const { path, navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Extract search and category from URL query
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(['All', ...data]);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        let url = `${API_BASE}/products`;
        const params: string[] = [];

        if (searchQuery) {
          params.push(`search=${encodeURIComponent(searchQuery)}`);
        }

        if (selectedCategory && selectedCategory !== 'All') {
          params.push(`category=${encodeURIComponent(selectedCategory)}`);
        }

        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to load products');
        }
        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong while loading products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, path]);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative bg-[#0b0c10] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 rounded-b-[40px] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/50 via-gray-900 to-black"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[120px]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Discover the Next Generation</span>
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Curated Essentials <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-white bg-clip-text text-transparent">
              Designed for Modern Living
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Explore premium lifestyle goods, gadgets, and accessories handpicked for quality, utility, and timeless aesthetics.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a
              href="#catalog"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <span>Shop Collection</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        
        {/* Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Products'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {products.length} premium creations
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto py-1 no-scrollbar">
            <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block mr-2" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  if (category === 'All') {
                    params.delete('category');
                  } else {
                    params.set('category', category);
                  }
                  const newSearch = params.toString();
                  navigate(newSearch ? `/?${newSearch}` : '/');
                }}
                className={`px-4 py-2 text-xs font-bold rounded-2xl cursor-pointer transition-all uppercase tracking-wider shrink-0 border ${
                  selectedCategory === category
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600"></div>
            <p className="text-sm text-gray-500 font-medium">Refining collection...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl text-center font-medium max-w-md mx-auto my-12">
            {error}
          </div>
        )}

        {/* Empty Catalog View */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-[30px] border border-dashed border-gray-200 max-w-xl mx-auto">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">
              We couldn't find any items matching your criteria. Try adjusting your search query or filters.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
