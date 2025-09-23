import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import CanIAffordThis from './pages/CanIAffordThis';
import Home from './pages/Home';
import { AnimatePresence } from 'framer-motion';

// Component to handle smart routing based on device type
const SmartDefaultRoute = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isNative = Capacitor.isNativePlatform();

  // Mobile (native app or small screen) goes to Home
  // Desktop goes to Dashboard
  const defaultRoute = (isMobile || isNative) ? '/home' : '/dashboard';

  return <Navigate to={defaultRoute} replace />;
};

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CustomThemeProvider>
        <AuthProvider>
          <UserProvider>
            <Router>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<SmartDefaultRoute />} />
                    <Route path="home" element={<Home />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="budgets" element={<Budgets />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="can-i-afford-this" element={<CanIAffordThis />} />
                  </Route>
                  <Route path="*" element={<SmartDefaultRoute />} />
                </Routes>
              </AnimatePresence>
            </Router>
          </UserProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
