import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './security/auth';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Shop from './pages/Shop';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';

import { CartProvider } from './context/CartContext';
import { InventoryProvider } from './context/InventoryContext';
import Navbar from './components/Navbar';
import { AnimatePresence } from 'framer-motion';
import Loader from './components/Loader';
import { useInventory } from './context/InventoryContext';

import { useLocation } from 'react-router-dom';

function AnimatedRoutes({ currentView, setCurrentView, isCartOpen, setIsCartOpen }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Shop currentView={currentView} setCurrentView={setCurrentView} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Shop currentView={currentView} setCurrentView={setCurrentView} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [currentView, setCurrentView] = React.useState('home');
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { loading } = useInventory();

  const handleFinished = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <Loader
            onFinished={handleFinished}
            ready={!loading}
          />
        )}
      </AnimatePresence>
      <Router basename={import.meta.env.BASE_URL}>
        <Navbar
          onViewChange={setCurrentView}
          currentView={currentView}
          onCartToggle={() => setIsCartOpen(true)}
        />
        <AnimatedRoutes
          currentView={currentView}
          setCurrentView={setCurrentView}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
        />
      </Router>
    </>
  );
}

export default App;
