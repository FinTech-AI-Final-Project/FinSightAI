import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import { motion } from 'framer-motion';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
        flexGrow: 1,
        overflow: 'hidden',
        height: 'calc(100vh - 64px)' // Full height minus navbar
      }}>
        {!isMobile && <Sidebar />}
        <Box
          component="main"
          className="main-content-scrollable"
          sx={{
            pt: { xs: 10, md: 12 },
            pb: 0,
            px: { xs: 1, sm: 2, md: 3 },
            backgroundColor: 'background.default',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Box sx={{ 
            width: '100%',
            maxWidth: { xs: '100%', sm: '800px', md: '900px', lg: '1000px' },
            mx: 'auto'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </Box>
        </Box>
      </Box>
  {/* BottomNavigation removed for all devices */}
      <Chatbot />
    </Box>
  );
};

export default Layout;
