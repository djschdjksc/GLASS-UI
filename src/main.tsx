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
}, { capture: true });

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
