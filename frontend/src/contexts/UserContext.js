import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as ApiService from '../services/api';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currency: 'ZAR',
    profilePictureUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { currentUser } = useAuth();

  const fetchUserProfile = useCallback(async (retryCount = 0) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userData = await ApiService.getUserProfile();
      
      console.log('UserContext: Received profile data:', userData);
      
      // Check if we got empty names but have retry attempts left (for newly registered users)
      if ((!userData.firstName || !userData.lastName) && retryCount < 3) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1}) - got empty names:`, {
          firstName: userData.firstName,
          lastName: userData.lastName
        });
        setTimeout(() => {
          fetchUserProfile(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
        return;
      }
      
      setUserProfile({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        currency: userData.currency || 'ZAR',
        profilePictureUrl: userData.profilePictureUrl || '',
      });
      setInitialized(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // If it's a "User not found" error and we have retries left, wait and try again
      if (error.message && error.message.includes('not found') && retryCount < 3) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1}) - user not found yet`);
        setTimeout(() => {
          fetchUserProfile(retryCount + 1);
        }, 1500 * (retryCount + 1)); // Longer wait for "not found" errors
        return;
      }
      
      // Set default values if fetch fails after all retries
      setUserProfile(prev => ({
        ...prev,
        currency: 'ZAR'
      }));
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateUserProfile = async (updatedData) => {
    try {
      setLoading(true);
      const previousCurrency = userProfile.currency;
      
      await ApiService.updateUserProfile(updatedData);
      // Update the profile immediately in context
      setUserProfile(prev => ({ ...prev, ...updatedData }));
      
      // Dispatch currency change event if currency was updated
      if (updatedData.currency && updatedData.currency !== previousCurrency) {
        window.dispatchEvent(new CustomEvent('currencyChanged', {
          detail: { 
            oldCurrency: previousCurrency, 
            newCurrency: updatedData.currency 
          }
        }));
      }
      
      // Also refetch to ensure consistency
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    return await fetchUserProfile();
  };

  useEffect(() => {
    if (currentUser) {
      // Clear previous user data and reset initialized flag when user changes
      setInitialized(false);
      setUserProfile({
        firstName: '',
        lastName: '',
        email: '',
        currency: 'ZAR',
        profilePictureUrl: '',
      });
      // Then fetch new user data
      fetchUserProfile();
    } else {
      // Clear user profile when no user is logged in
      setInitialized(false);
      setUserProfile({
        firstName: '',
        lastName: '',
        email: '',
        currency: 'ZAR',
        profilePictureUrl: '',
      });
    }

    // Listen for registration completion event
    const handleRegistrationComplete = (event) => {
      console.log('UserContext: Received registration complete event', event.detail);
      // Wait a bit then fetch profile again to get the complete data
      setTimeout(() => {
        console.log('UserContext: Refreshing profile after registration');
        fetchUserProfile();
      }, 1000);
    };

    window.addEventListener('userRegistrationComplete', handleRegistrationComplete);

    return () => {
      window.removeEventListener('userRegistrationComplete', handleRegistrationComplete);
    };
  }, [currentUser, fetchUserProfile]);

  const value = {
    userProfile,
    loading,
    initialized,
    fetchUserProfile,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
