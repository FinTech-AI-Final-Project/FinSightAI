import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';

// Custom Icon Component for mobile navigation icons
const MobileNavIcon = ({ src, alt, selected }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: 24,
      height: 24,
      filter: 'none', // Keep original colors for all states
      opacity: selected ? 1 : 0.6, // Full opacity when selected, reduced when not
      transition: 'opacity 0.2s ease',
    }}
  />
);

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    switch (location.pathname) {
      case '/home':
        return 0;
      case '/settings':
        return 1;
      default:
        return 0;
    }
  };

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/home');
        break;
      case 1:
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <Paper
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000,
        backgroundColor: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
      }}
      elevation={8}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MuiBottomNavigation
          value={getValue()}
          onChange={handleChange}
          showLabels
          sx={{
            height: 64,
            backgroundColor: '#000000',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-selected': {
                color: '#ffffff',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              marginTop: '4px',
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<MobileNavIcon src="/mobile-dashboard.png" alt="Home" selected={getValue() === 0} />}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<MobileNavIcon src="/mobile-settings.png" alt="Settings" selected={getValue() === 1} />}
          />
        </MuiBottomNavigation>
      </motion.div>
    </Paper>
  );
};

export default BottomNavigation;
