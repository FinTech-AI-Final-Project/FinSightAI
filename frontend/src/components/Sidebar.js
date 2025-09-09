import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';

// Custom Icon Component for navigation icons
const NavIcon = ({ src, alt, selected }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: 24,
      height: 24,
      filter: 'none', // Keep original colors for all states
      opacity: 1, // Full opacity for both selected and unselected states
      transition: 'opacity 0.2s ease',
    }}
  />
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      iconSrc: '/dashboard.png',
      path: '/dashboard',
    },
    {
      text: 'Expenses',
      iconSrc: '/expenses.png',
      path: '/expenses',
    },
    {
      text: 'Budgets',
      iconSrc: '/budget.png',
      path: '/budgets',
    },
    {
      text: 'Reports',
      iconSrc: '/report.png',
      path: '/reports',
    },
    {
      text: 'Settings',
      iconSrc: '/settings.png',
      path: '/settings',
    },
  ];

  const handleItemClick = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          top: '64px', // Match the navbar height exactly
          height: 'calc(100vh - 64px)', // Adjust height accordingly
          position: 'fixed',
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          Navigation
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 1.5 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => handleItemClick(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  <NavIcon 
                    src={item.iconSrc} 
                    alt={item.text} 
                    selected={location.pathname === item.path}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
