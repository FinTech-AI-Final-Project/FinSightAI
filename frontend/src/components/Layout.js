import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import { motion } from 'framer-motion';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {!isMobile && <Sidebar />}
        <Box
          component="main"
          className="main-content-scrollable"
          sx={{
            flexGrow: 1,
            pt: { xs: 10, md: 12 }, // Increased padding for better spacing from navbar
            pb: { xs: 8, md: 2 },
            px: { xs: 1, sm: 2, md: 3 },
            backgroundColor: 'background.default',
            ml: { md: '280px' }, // Account for sidebar width
            overflow: 'auto', // Enable scrolling
            height: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 64px)' }, // Proper height calculation
            maxHeight: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 64px)' }, // Ensure it doesn't exceed viewport
            position: 'relative', // Ensure proper stacking context
            zIndex: 1, // Below navbar but above other elements
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>
      {isMobile && <BottomNavigation />}
      <Chatbot />
    </Box>
  );
};

export default Layout;
