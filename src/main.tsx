import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import './index.css';

// Global handler to catch any unhandled promise rejections or errors silently
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled Promise Rejection caught:', event.reason);
    event.preventDefault();
  });
  window.addEventListener('error', (event) => {
    console.warn('Global error caught:', event.error || event.message);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);

