import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  AccountBalance,
  Analytics,
  Settings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 0;
      case '/expenses':
        return 1;
      case '/budgets':
        return 2;
      case '/reports':
        return 3;
      case '/settings':
        return 4;
      default:
        return 0;
    }
  };

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/expenses');
        break;
      case 2:
        navigate('/budgets');
        break;
      case 3:
        navigate('/reports');
        break;
      case 4:
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
        borderTop: 1,
        borderColor: 'divider',
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
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              marginTop: '4px',
            },
          }}
        >
          <BottomNavigationAction
            label="Dashboard"
            icon={<Dashboard />}
          />
          <BottomNavigationAction
            label="Expenses"
            icon={<Receipt />}
          />
          <BottomNavigationAction
            label="Budgets"
            icon={<AccountBalance />}
          />
          <BottomNavigationAction
            label="Reports"
            icon={<Analytics />}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<Settings />}
          />
        </MuiBottomNavigation>
      </motion.div>
    </Paper>
  );
};

export default BottomNavigation;
