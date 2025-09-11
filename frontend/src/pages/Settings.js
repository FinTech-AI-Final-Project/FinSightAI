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
  Grid,
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { userProfile, updateUserProfile, fetchUserProfile } = useUser();
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
    // Sync profileData with userProfile from context and currentUser from Firebase
    console.log('👤 Settings: Syncing profile data from context and auth');
    console.log('📊 UserProfile from context:', userProfile);
    console.log('🔥 CurrentUser from Firebase:', currentUser);
    
    // Prioritize userProfile from context, fallback to Firebase user, then fallback to empty values
    const firstName = userProfile.firstName || 
                     (currentUser?.displayName?.split(' ')[0]) || 
                     '';
    const lastName = userProfile.lastName || 
                    (currentUser?.displayName?.split(' ')[1]) || 
                    '';
    const email = userProfile.email || currentUser?.email || '';
    const currency = userProfile.currency || 'ZAR';
    const profilePictureUrl = userProfile.profilePictureUrl || currentUser?.photoURL || '';
    
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
  }, [userProfile, currentUser]);

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
      setError('');
      
      // Validate required fields
      if (!profileData.firstName || !profileData.lastName || !profileData.email) {
        setError('Please fill in all required fields');
        return;
      }

      // Use UserContext update method for real-time updates
      const success = await updateUserProfile(profileData);
      if (success) {
        setEditingProfile(false);
        setSuccess('Profile updated successfully');
        // ProfileData will be updated automatically via context
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (base64Image) => {
    try {
      setLoading(true);
      setError('');
      
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
      setError(`Failed to update profile picture: ${error.message}`);
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
      setError('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion');
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
      setError(`Failed to delete account: ${error.message}`);
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
        setError('Failed to send test notification. Please check your notification permissions.');
      }
    } catch (error) {
      setError('Error testing notifications: ' + error.message);
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

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

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                <ProfilePictureUpload
                  currentPicture={profileData.profilePictureUrl}
                  onPictureChange={handleProfilePictureChange}
                  size={100}
                  editable={true}
                />
              </Grid>

              <Grid item xs={12} sm={9}>
                {editingProfile ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        disabled
                        variant="outlined"
                        size="small"
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
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
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={() => setEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
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
              </Grid>
            </Grid>
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
            setError('');
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
                setError('');
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
