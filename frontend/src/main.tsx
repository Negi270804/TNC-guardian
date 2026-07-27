import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Clear chunk loading retry state on successful application boot
try {
  window.sessionStorage.removeItem('chunk-retry-done');
} catch (e) {
  // Ignore private navigation session exceptions
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
