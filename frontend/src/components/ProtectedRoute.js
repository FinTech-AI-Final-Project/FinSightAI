import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { currentUser, token } = useAuth();

  if (!currentUser || !token) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Loading component for protected routes
export const RouteLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress size={40} />
  </Box>
);

export default ProtectedRoute;
