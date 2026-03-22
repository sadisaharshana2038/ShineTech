import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './security/auth'
import { InventoryProvider } from './context/InventoryContext'
import { CartProvider } from './context/CartContext'

import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <InventoryProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </InventoryProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
