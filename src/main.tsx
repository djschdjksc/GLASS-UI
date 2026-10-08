import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary'

// Globally block Up/Down arrow keys & wheel from changing number input values
window.addEventListener('keydown', (e) => {
  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (e.target as HTMLElement)?.tagName === 'INPUT') {
    const input = e.target as HTMLInputElement;
    if (input.type === 'number') {
      e.preventDefault();
    }
  }

  // Globally intercept Ctrl+P and Ctrl+Shift+P at root capture phase so browser print never opens
  if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
  }
}, { capture: true });

// Globally disable browser's native window.print() dialog permanently
window.print = () => {
  console.warn('[Direct Print Guard] Browser native window.print() blocked. Direct Python Print Engine active.');
};

window.addEventListener('wheel', () => {
  if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') {
    const input = document.activeElement as HTMLInputElement;
    if (input.type === 'number') {
      input.blur();
    }
  }
}, { passive: true });

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
