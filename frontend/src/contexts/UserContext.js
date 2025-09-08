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
  const { currentUser } = useAuth();

  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userData = await ApiService.getUserProfile();
      setUserProfile({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        currency: userData.currency || 'ZAR',
        profilePictureUrl: userData.profilePictureUrl || '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set default values if fetch fails
      setUserProfile(prev => ({
        ...prev,
        currency: 'ZAR'
      }));
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
      fetchUserProfile();
    }
  }, [currentUser, fetchUserProfile]);

  const value = {
    userProfile,
    loading,
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
