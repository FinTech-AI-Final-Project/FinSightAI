import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';
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
            pt: { xs: 14, md: 16 }, // Increased padding to properly clear navbar
            pb: { xs: 8, md: 2 },
            px: { xs: 1, sm: 2, md: 3 },
            backgroundColor: 'background.default',
            ml: { md: '280px' }, // Account for sidebar width
            overflow: 'auto', // Enable scrolling
            height: 'calc(100vh - 112px)', // Updated height calculation (navbar + padding)
            maxHeight: 'calc(100vh - 112px)', // Ensure it doesn't exceed viewport
            position: 'relative', // Ensure proper stacking context
            zIndex: 10, // Below navbar but above other elements
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
    </Box>
  );
};

export default Layout;
