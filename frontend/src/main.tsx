import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Patch fetch globally to bypass localtunnel warning page on cross-origin API calls
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    if (url.includes('.loca.lt')) {
      const headers = new Headers(init?.headers || {});
      headers.set('bypass-tunnel-reminder', 'true');
      
      if (input instanceof Request) {
        return originalFetch(new Request(input, { headers }), init);
      }
      
      return originalFetch(input, {
        ...init,
        headers
      });
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
