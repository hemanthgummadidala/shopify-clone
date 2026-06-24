import React from 'react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';
import { Link } from './Router.js';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-50/50 flex flex-col h-full">
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden aspect-[4/3] bg-gray-50">
        {/* Category Badge */}
        <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/95 backdrop-blur-sm text-xs font-semibold text-gray-800 rounded-full shadow-sm">
          {product.category}
        </span>
        {/* Image with zoom effect */}
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      <div className="p-6 flex flex-col flex-grow">
        {/* Rating */}
        <div className="flex items-center space-x-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs font-medium text-gray-400 pl-1">(12)</span>
        </div>

        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-grow">
          {product.description}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</span>
            <span className="text-xl font-extrabold text-gray-900">
              ₹{parseFloat(product.price as any).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-indigo-600 transition-all cursor-pointer shadow-md shadow-gray-100 hover:shadow-indigo-100 active:scale-95"
            title="Add to Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
