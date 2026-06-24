import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product } from '../types.js';
import { useAuth } from './AuthContext.js';
import { trackAddToCart, trackRemoveFromCart } from '../services/analytics.js';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, apiFetch } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isSyncing = useRef<boolean>(false);

  // Load cart from local storage on mount (for guest mode)
  useEffect(() => {
    if (!user) {
      const savedCart = localStorage.getItem('shopify_guest_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse local cart:', error);
        }
      }
    }
  }, [user]);

  // Load cart from database when user logs in and sync any local guest items
  useEffect(() => {
    const syncCart = async () => {
      if (!user || !token || isSyncing.current) return;
      isSyncing.current = true;
      setLoading(true);

      try {
        // Fetch cart from DB
        const dbCart = await apiFetch('/orders/cart');

        // Check if there are guest items in current state
        const localGuestCart = localStorage.getItem('shopify_guest_cart');
        const guestItems: CartItem[] = localGuestCart ? JSON.parse(localGuestCart) : [];

        if (guestItems.length > 0) {
          console.log('Syncing guest items to database...');
          // Push guest items to DB
          for (const item of guestItems) {
            await apiFetch('/orders/cart', {
              method: 'POST',
              body: JSON.stringify({
                product_id: item.product_id,
                quantity: item.quantity
              })
            });
          }
          // Clear guest cart
          localStorage.removeItem('shopify_guest_cart');
          // Fetch final database cart
          const finalDbCart = await apiFetch('/orders/cart');
          setCart(mapDbCartToCartItems(finalDbCart));
        } else {
          setCart(mapDbCartToCartItems(dbCart));
        }
      } catch (error) {
        console.error('Failed to sync database cart:', error);
      } finally {
        setLoading(false);
        isSyncing.current = false;
      }
    };

    if (user) {
      syncCart();
    } else {
      setCart([]);
    }
  }, [user, token]);

  const mapDbCartToCartItems = (dbCart: any[]): CartItem[] => {
    return dbCart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product_title: item.product_title,
      product_price: parseFloat(item.product_price),
      product_image: item.product_image
    }));
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (user) {
      setLoading(true);
      try {
        const existingItem = cart.find(item => item.product_id === product.id);
        const newQty = (existingItem?.quantity || 0) + quantity;
        const result = await apiFetch('/orders/cart', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id, quantity: newQty })
        });
        setCart(mapDbCartToCartItems(result));
      } catch (error) {
        console.error('Add to DB cart failed:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest mode
      setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(item => item.product_id === product.id);
        let updatedCart = [...prevCart];

        if (existingItemIndex > -1) {
          updatedCart[existingItemIndex].quantity += quantity;
        } else {
          updatedCart.push({
            product_id: product.id,
            quantity: quantity,
            product_title: product.title,
            product_price: product.price,
            product_image: product.image_url
          });
        }
        localStorage.setItem('shopify_guest_cart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    }

    // Log standard GA4 add_to_cart event
    trackAddToCart({
      id: product.id,
      title: product.title,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      category: product.category
    }, quantity);
  };

  const removeFromCart = async (productId: number) => {
    const itemToRemove = cart.find(item => item.product_id === productId);

    if (user) {
      setLoading(true);
      try {
        await apiFetch(`/orders/cart/${productId}`, { method: 'DELETE' });
        setCart(prev => prev.filter(item => item.product_id !== productId));
      } catch (error) {
        console.error('Remove from DB cart failed:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest mode
      setCart(prevCart => {
        const updatedCart = prevCart.filter(item => item.product_id !== productId);
        localStorage.setItem('shopify_guest_cart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    }

    // Log standard GA4 remove_from_cart event
    if (itemToRemove) {
      trackRemoveFromCart({
        id: itemToRemove.product_id,
        title: itemToRemove.product_title,
        price: itemToRemove.product_price
      }, itemToRemove.quantity);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (user) {
      setLoading(true);
      try {
        const result = await apiFetch('/orders/cart', {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, quantity })
        });
        setCart(mapDbCartToCartItems(result));
      } catch (error) {
        console.error('Update DB cart quantity failed:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest mode
      setCart(prevCart => {
        const updatedCart = prevCart.map(item =>
          item.product_id === productId ? { ...item, quantity } : item
        );
        localStorage.setItem('shopify_guest_cart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    }
  };

  const clearCart = async () => {
    if (user) {
      setLoading(true);
      try {
        // Remove all items individually
        for (const item of cart) {
          await apiFetch(`/orders/cart/${item.product_id}`, { method: 'DELETE' });
        }
        setCart([]);
      } catch (error) {
        console.error('Clear DB cart failed:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCart([]);
      localStorage.removeItem('shopify_guest_cart');
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product_price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
