import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactGA from 'react-ga4';
import { useAuth } from '../context/AuthContext.js';
import { initGA, trackPageView } from '../services/analytics.js';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

// Legacy trackEvent wrapper for compatibility
export const trackEvent = (action: string, params: Record<string, any> = {}) => {
  const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event(action, params);
  }
  console.log(`[GA4 Legacy event wrapper] ${action}:`, params);
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getFullPath = () => window.location.pathname + window.location.search;
  const [path, setPath] = useState(getFullPath());
  const { user } = useAuth();

  // Initialize GA4 on mount
  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getFullPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track user profile/status in GA
  useEffect(() => {
    const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (user) {
      if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
        ReactGA.gtag('set', 'user_id', String(user.id));
        ReactGA.gtag('set', 'user_properties', {
          account_status: 'active',
          user_role: user.role,
        });
      }
      console.log(`[Google Analytics] User ID and properties set: ID=${user.id}, status=active, role=${user.role}`);
    } else {
      if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
        ReactGA.gtag('set', 'user_id', undefined);
      }
      console.log('[Google Analytics] User logged out, cleared GA user_id');
    }
  }, [user]);

  // Track page view on path change
  useEffect(() => {
    trackPageView(path, document.title);
  }, [path]);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export const Link: React.FC<LinkProps> = ({ to, children, className, ...props }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};

interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export const Route: React.FC<RouteProps> = ({ path, element }) => {
  const { path: currentPath } = useRouter();
  
  // Exact matching for home, startsWith or regex matching for details, etc.
  const isMatch = () => {
    if (path.includes('/:id')) {
      const baseRoute = path.split('/:id')[0];
      const match = currentPath.startsWith(baseRoute) && currentPath.length > baseRoute.length;
      return match;
    }
    const currentPathname = currentPath.split('?')[0];
    return currentPathname === path;
  };

  return isMatch() ? <>{element}</> : null;
};
