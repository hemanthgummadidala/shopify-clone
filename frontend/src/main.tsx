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
      const newInit = { ...init };
      newInit.credentials = 'include'; // Send bypass cookies with cross-origin requests
      
      const headers = new Headers(newInit.headers || {});
      headers.set('bypass-tunnel-reminder', 'true');
      newInit.headers = headers;
      
      if (input instanceof Request) {
        return originalFetch(new Request(input, newInit), init);
      }
      
      return originalFetch(input, newInit);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
