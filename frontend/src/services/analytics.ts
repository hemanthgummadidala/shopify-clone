import ReactGA from 'react-ga4';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const isProduction = import.meta.env.PROD;

// Initialize GA4 if ID is valid and not the placeholder
export const initGA = () => {
  try {
    if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
      ReactGA.initialize(GA_ID, {
        testMode: !isProduction, // In non-production, dry-run or mock mode is enabled via testMode
      });
      console.log(`[Google Analytics 4] Initialized with ID: ${GA_ID} (Production: ${isProduction})`);
    } else {
      console.log('[Google Analytics 4] Running in dry-run/mock mode (missing or placeholder ID)');
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to initialize Google Analytics:', error);
  }
};

// Helper check to see if GA is active
const isGAActive = () => GA_ID && GA_ID !== 'G-XXXXXXXXXX';

/**
 * Tracks a page view event.
 * @param path The URL path and search query parameter string.
 * @param title The document title of the page.
 */
export const trackPageView = (path: string, title?: string) => {
  const cleanPath = path.split('?')[0]; // Standardize page views to the clean pathname
  try {
    if (isGAActive()) {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title || cleanPath
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send page view:', error);
  }
  console.log(`[GA4 Event] page_view: ${path} (Title: ${title || cleanPath})`);
};

/**
 * Tracks a user login event.
 * @param method The login method used (e.g., 'email', 'google').
 */
export const trackLogin = (method: string = 'email') => {
  try {
    if (isGAActive()) {
      ReactGA.event('login', { method });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send login event:', error);
  }
  console.log(`[GA4 Event] login: method=${method}`);
};

/**
 * Tracks a user registration (sign up) event.
 * @param method The signup method used (e.g., 'email').
 */
export const trackSignUp = (method: string = 'email') => {
  try {
    if (isGAActive()) {
      ReactGA.event('sign_up', { method });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send sign up event:', error);
  }
  console.log(`[GA4 Event] sign_up: method=${method}`);
};

/**
 * Tracks a search query event.
 * @param searchTerm The query terms searched by the user.
 */
export const trackSearch = (searchTerm: string) => {
  try {
    if (isGAActive()) {
      ReactGA.event('search', { search_term: searchTerm });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send search event:', error);
  }
  console.log(`[GA4 Event] search: search_term=${searchTerm}`);
};

// Interface representing standard GA4 ecommerce item
export interface GA4EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

/**
 * Tracks a product details view (view_item).
 * @param product The product being viewed.
 */
export const trackViewItem = (product: { id: number; title: string; price: number; category?: string }) => {
  const items: GA4EcommerceItem[] = [{
    item_id: product.id.toString(),
    item_name: product.title,
    price: product.price,
    quantity: 1,
    item_category: product.category
  }];

  try {
    if (isGAActive()) {
      ReactGA.event('view_item', {
        currency: 'INR',
        value: product.price,
        items
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send view item event:', error);
  }
  console.log('[GA4 Event] view_item:', { currency: 'INR', value: product.price, items });
};

/**
 * Tracks an item added to the shopping cart.
 * @param product The product being added.
 * @param quantity The quantity of items added.
 */
export const trackAddToCart = (product: { id: number; title: string; price: number; category?: string }, quantity: number = 1) => {
  const items: GA4EcommerceItem[] = [{
    item_id: product.id.toString(),
    item_name: product.title,
    price: product.price,
    quantity,
    item_category: product.category
  }];

  const totalValue = product.price * quantity;

  try {
    if (isGAActive()) {
      ReactGA.event('add_to_cart', {
        currency: 'INR',
        value: totalValue,
        items
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send add to cart event:', error);
  }
  console.log('[GA4 Event] add_to_cart:', { currency: 'INR', value: totalValue, items });
};

/**
 * Tracks an item removed from the shopping cart.
 * @param product The product being removed.
 * @param quantity The quantity of items removed.
 */
export const trackRemoveFromCart = (product: { id: number; title: string; price: number; category?: string }, quantity: number = 1) => {
  const items: GA4EcommerceItem[] = [{
    item_id: product.id.toString(),
    item_name: product.title,
    price: product.price,
    quantity,
    item_category: product.category
  }];

  const totalValue = product.price * quantity;

  try {
    if (isGAActive()) {
      ReactGA.event('remove_from_cart', {
        currency: 'INR',
        value: totalValue,
        items
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send remove from cart event:', error);
  }
  console.log('[GA4 Event] remove_from_cart:', { currency: 'INR', value: totalValue, items });
};

/**
 * Tracks the start of the checkout flow (begin_checkout).
 * @param cartItems The array of items in the shopping cart.
 * @param totalPrice The total value of the cart items.
 */
export const trackBeginCheckout = (
  cartItems: Array<{ product_id: number; product_title: string; product_price: number; quantity: number }>,
  totalPrice: number
) => {
  const items: GA4EcommerceItem[] = cartItems.map(item => ({
    item_id: item.product_id.toString(),
    item_name: item.product_title,
    price: item.product_price,
    quantity: item.quantity
  }));

  try {
    if (isGAActive()) {
      ReactGA.event('begin_checkout', {
        currency: 'INR',
        value: totalPrice,
        items
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send begin checkout event:', error);
  }
  console.log('[GA4 Event] begin_checkout:', { currency: 'INR', value: totalPrice, items });
};

/**
 * Tracks a successful checkout purchase order.
 * @param transactionId The backend-generated order transaction ID.
 * @param cartItems The array of purchased cart items.
 * @param totalPrice The total price paid.
 */
export const trackPurchase = (
  transactionId: string,
  cartItems: Array<{ product_id: number; product_title: string; product_price: number; quantity: number }>,
  totalPrice: number
) => {
  const items: GA4EcommerceItem[] = cartItems.map(item => ({
    item_id: item.product_id.toString(),
    item_name: item.product_title,
    price: item.product_price,
    quantity: item.quantity
  }));

  try {
    if (isGAActive()) {
      ReactGA.event('purchase', {
        transaction_id: transactionId,
        currency: 'INR',
        value: totalPrice,
        items
      });
    }
  } catch (error) {
    console.warn('[GA4 Tracking Error] Failed to send purchase event:', error);
  }
  console.log('[GA4 Event] purchase:', { transaction_id: transactionId, currency: 'INR', value: totalPrice, items });
};
