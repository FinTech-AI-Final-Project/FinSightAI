import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Person,
  Security,
  Notifications,
  Language,
  Help,
  Info,
  Edit,
  Save,
  Cancel,
  Logout,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useErrorHandler } from '../utils/errorHandler';
import ErrorAlert from '../components/ErrorAlert';
import * as ApiService from '../services/api';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import NotificationService from '../services/notificationService';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { error, handleError, clearError } = useErrorHandler();
  const [success, setSuccess] = useState('');
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { userProfile, updateUserProfile, fetchUserProfile, loading: userLoading, initialized } = useUser();
  const theme = useTheme();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currency: 'ZAR',
    profilePictureUrl: '',
  });

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReports: true,
    expenseReminders: false,
    aiTips: true,
  });

  const [notificationStatus, setNotificationStatus] = useState('unknown');

  useEffect(() => {
    // Only sync profile data after UserContext has been initialized
    if (!initialized && currentUser) {
      // Still loading user profile, don't update yet
      console.log('👤 Settings: Waiting for UserContext to initialize...');
      return;
    }

    console.log('👤 Settings: Syncing profile data from context and auth');
    console.log('📊 UserProfile from context:', userProfile);
    console.log('🔥 CurrentUser from Firebase:', currentUser);
    console.log('✅ UserContext initialized:', initialized);
    
    // Only use Firebase user data as fallback if UserContext is initialized but empty
    // This prevents showing stale Firebase data while UserContext is loading new user data
    const firstName = userProfile.firstName || 
                     (initialized ? (currentUser?.displayName?.split(' ')[0] || '') : '');
    const lastName = userProfile.lastName || 
                    (initialized ? (currentUser?.displayName?.split(' ')[1] || '') : '');
    const email = userProfile.email || (initialized ? (currentUser?.email || '') : '');
    const currency = userProfile.currency || 'ZAR';
    const profilePictureUrl = userProfile.profilePictureUrl || 
                             (initialized ? (currentUser?.photoURL || '') : '');
    
    setProfileData({
      firstName,
      lastName,
      email,
      currency,
      profilePictureUrl,
    });
    
    console.log('✅ Settings: Profile data set to:', {
      firstName,
      lastName,
      email,
      currency,
      profilePictureUrl: profilePictureUrl ? 'Present' : 'Not present'
    });
    
    setUser({ firstName, lastName, email, currency, profilePictureUrl });
  }, [userProfile, currentUser, initialized]);

  useEffect(() => {
    // Check notification status
    const checkNotificationStatus = () => {
      if (NotificationService.isAvailable()) {
        setNotificationStatus('available');
      } else if ('Notification' in window) {
        setNotificationStatus('web-only');
      } else {
        setNotificationStatus('unavailable');
      }
    };

    checkNotificationStatus();

    // Load notification preferences from localStorage
    const savedNotifications = localStorage.getItem('notificationPreferences');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      clearError();
      
      // Validate required fields
      if (!profileData.firstName || !profileData.lastName || !profileData.email) {
        handleError(new Error('Please fill in all required fields'));
        return;
      }

      // Use UserContext update method for real-time updates
      const success = await updateUserProfile(profileData);
      if (success) {
        setEditingProfile(false);
        setSuccess('Profile updated successfully');
        // ProfileData will be updated automatically via context
      } else {
        handleError(new Error('Failed to update profile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (base64Image) => {
    try {
      setLoading(true);
      clearError();
      
      if (base64Image) {
        // Update profile picture via API
        await ApiService.updateProfilePicture(base64Image);
      }
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        profilePictureUrl: base64Image || ''
      }));
      
      // Update context
      await updateUserProfile({
        ...profileData,
        profilePictureUrl: base64Image || ''
      });
      
      setSuccess(base64Image ? 'Profile picture updated successfully' : 'Profile picture removed successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      handleError(new Error('Failed to logout'));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      handleError(new Error('Please type "DELETE" to confirm account deletion'));
      return;
    }

    try {
      setLoading(true);
      
      if (!currentUser) {
        throw new Error('No user is currently logged in');
      }

      // Get a fresh token first to ensure we have a valid one
      const token = await currentUser.getIdToken(true);
      localStorage.setItem('authToken', token);

      // First delete the user in the backend while we have a valid token
      const wasDeleted = await ApiService.deleteUser();
      if (!wasDeleted) {
        throw new Error('Failed to delete user from backend');
      }
      
      // Then delete the Firebase user
      await currentUser.delete();
      
      // Clear all local storage data
      localStorage.clear();
      
      // Finally perform logout and redirect
      await logout();
      navigate('/login');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      handleError(error);
      // Re-enable the delete button by clearing loading state
      setLoading(false);
      return;
    }
    
    // Only clear dialog state if deletion was successful
    setLoading(false);
    setShowDeleteDialog(false);
    setDeleteConfirmText('');
  };

  const handleNotificationChange = (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(newNotifications);
    
    // Save to localStorage
    localStorage.setItem('notificationPreferences', JSON.stringify(newNotifications));
    
    // Schedule/cancel notifications based on preference
    if (newNotifications[key]) {
      switch (key) {
        case 'weeklyReports':
          NotificationService.scheduleWeeklyReport();
          break;
        case 'expenseReminders':
          NotificationService.scheduleExpenseReminder();
          break;
        default:
          break;
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await NotificationService.testNotification();
      if (success) {
        setSuccess('Test notification sent! Check your notifications.');
      } else {
        handleError(new Error('Failed to send test notification. Please check your notification permissions.'));
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Settings
        </Typography>

        <ErrorAlert error={error} />

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Profile Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Profile Information
              </Typography>
              {!editingProfile && (
                <IconButton onClick={() => setEditingProfile(true)}>
                  <Edit />
                </IconButton>
              )}
            </Box>

            {!initialized && currentUser ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography color="text.secondary">Loading profile...</Typography>
              </Box>
            ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, textAlign: 'center' }}>
                <ProfilePictureUpload
                  currentPicture={profileData.profilePictureUrl}
                  onPictureChange={handleProfilePictureChange}
                  size={100}
                  editable={true}
                />
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                {editingProfile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      variant="outlined"
                      size="small"
                      helperText="Email cannot be changed"
                    />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                      <FormControl fullWidth size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 200px' } }}>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={profileData.currency}
                          onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                          label="Currency"
                        >
                          <MenuItem value="ZAR">South African Rand (ZAR)</MenuItem>
                          <MenuItem value="USD">US Dollar (USD)</MenuItem>
                          <MenuItem value="EUR">Euro (EUR)</MenuItem>
                          <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                          <MenuItem value="JPY">Japanese Yen (JPY)</MenuItem>
                          <MenuItem value="CAD">Canadian Dollar (CAD)</MenuItem>
                          <MenuItem value="AUD">Australian Dollar (AUD)</MenuItem>
                        </Select>
                      </FormControl>
                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                          size="small"
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={() => setEditingProfile(false)}
                          size="small"
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {profileData.firstName} {profileData.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {profileData.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currency: {profileData.currency}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            )}
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Appearance
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={darkMode} 
                  onChange={toggleDarkMode}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  {darkMode ? <Brightness4 sx={{ mr: 1 }} /> : <Brightness7 sx={{ mr: 1 }} />}
                  Dark Mode
                </Box>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Toggle between light and dark themes
            </Typography>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Notifications
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleTestNotification}
                  disabled={notificationStatus === 'unavailable'}
                >
                  Test
                </Button>
                <Typography 
                  variant="caption" 
                  color={
                    notificationStatus === 'available' ? 'success.main' : 
                    notificationStatus === 'web-only' ? 'warning.main' : 
                    'error.main'
                  }
                  sx={{ fontSize: '0.75rem' }}
                >
                  {notificationStatus === 'available' ? '✅ Available' : 
                   notificationStatus === 'web-only' ? '⚠️ Web Only' : 
                   '❌ Unavailable'}
                </Typography>
              </Box>
            </Box>
            
            {notificationStatus === 'unavailable' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Notifications are not supported in this browser. For full notification support, use the mobile app.
              </Alert>
            )}
            
            {notificationStatus === 'web-only' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Basic browser notifications are available. For enhanced notifications, use the mobile app.
              </Alert>
            )}
            <List>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="Budget Alerts"
                  secondary="Get notified when you exceed your budget limits"
                />
                <Switch
                  checked={notifications.budgetAlerts}
                  onChange={() => handleNotificationChange('budgetAlerts')}
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="Weekly Reports"
                  secondary="Receive weekly spending summaries"
                />
                <Switch
                  checked={notifications.weeklyReports}
                  onChange={() => handleNotificationChange('weeklyReports')}
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="Expense Reminders"
                  secondary="Reminders to log your daily expenses"
                />
                <Switch
                  checked={notifications.expenseReminders}
                  onChange={() => handleNotificationChange('expenseReminders')}
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText 
                  primary="AI Tips"
                  secondary="Personalized financial advice and tips"
                />
                <Switch
                  checked={notifications.aiTips}
                  onChange={() => handleNotificationChange('aiTips')}
                  color="primary"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* App Information Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              App Information
            </Typography>
            <List>
              <ListItem button>
                <ListItemIcon>
                  <Info />
                </ListItemIcon>
                <ListItemText 
                  primary="About FinSight AI"
                  secondary="Version 1.0.0 - AI-powered finance management"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="error">
              Account Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Logout />}
                  onClick={() => setShowLogoutDialog(true)}
                  sx={{ mr: 2, mb: 1 }}
                >
                  Logout
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Sign out of your current session.
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setShowDeleteDialog(true)}
                  sx={{ mb: 1 }}
                >
                  Delete Account
                </Button>
                <Typography variant="body2" color="error">
                  ⚠️ Permanently delete your account and all associated data. This action cannot be undone.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Logout Confirmation Dialog */}
        <Dialog
          open={showLogoutDialog}
          onClose={() => setShowLogoutDialog(false)}
        >
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} color="primary" autoFocus>
              Logout
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeleteConfirmText('');
            clearError();
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            Delete Account
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              ⚠️ <strong>This action is permanent and cannot be undone.</strong>
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Deleting your account will permanently remove:
            </Typography>
            <ul>
              <li>All your expenses and financial data</li>
              <li>All budgets and spending categories</li>
              <li>All reports and analytics</li>
              <li>Your profile and account settings</li>
            </ul>
            <Typography sx={{ mt: 2, mb: 2, fontWeight: 600 }}>
              To confirm, please type "DELETE" below:
            </Typography>
            <TextField
              fullWidth
              label="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              error={error.includes('DELETE')}
              helperText={error.includes('DELETE') ? error : ''}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
                clearError();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAccount} 
              color="error" 
              variant="contained"
              disabled={loading || deleteConfirmText !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default Settings;
