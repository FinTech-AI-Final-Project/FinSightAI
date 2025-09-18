import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  AccountCircle,
  Brightness4,
  Brightness7,
  Logout,
  Settings,
  Notifications,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { userProfile } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isHomePage = location.pathname === '/home';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderBottom: 1,
        borderColor: theme.palette.divider,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 1, md: 2 } }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile ? (
              isHomePage ? (
                // On home page: Show logo and text
                <>
                  <img 
                    src="/logo.png" 
                    alt="FinSight AI" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    style={{ 
                      height: 32, 
                      width: 'auto',
                      marginRight: 8
                    }} 
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      background: darkMode 
                        ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
                        : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '1.1rem',
                    }}
                  >
                    FinSight AI
                  </Typography>
                </>
              ) : (
                // On other pages: Show back button
                <IconButton 
                  onClick={() => navigate('/home')} 
                  sx={{ 
                    color: darkMode ? '#ffffff' : '#000000',
                    '&:hover': {
                      background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  <ArrowBack />
                </IconButton>
              )
            ) : (
              <>
                <img 
                  src="/logo.png" 
                  alt="FinSight AI" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  style={{ 
                    height: 40, 
                    width: 'auto',
                    marginRight: 12
                  }} 
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    background: darkMode 
                      ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
                      : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  FinSight AI
                </Typography>
              </>
            )}
          </Box>
        </motion.div>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Account">
  <IconButton
    size="large"
    aria-label="account of current user"
    aria-controls="menu-appbar"
    aria-haspopup="true"
    onClick={handleMenu}
    color="inherit"
  >
    {userProfile?.profilePictureUrl ? (
      <Avatar 
        src={userProfile.profilePictureUrl} 
        alt={`${userProfile.firstName}'s profile`}
        sx={{ 
          width: 32, 
          height: 32,
          border: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
        }}
        imgProps={{
          onError: (e) => {
            e.target.src = ''; // Clear the source on error
            e.target.onerror = null; // Prevent infinite loop
          }
        }}
      />
    ) : (
      <AccountCircle />
    )}
  </IconButton>
</Tooltip>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiAvatar-root': {
                  width: 24,
                  height: 24,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <MenuItem onClick={handleSettings}>
              <Settings fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
