import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const signup = async (email, password, firstName, lastName) => {
    try {
      setIsSigningUp(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Register user in backend
      const userData = {
        firebaseUid: user.uid,
        email: user.email,
        firstName: firstName || 'User',
        lastName: lastName || 'Name',
        currency: 'ZAR',
        darkMode: false
      };
      
      // Store token for API call
      localStorage.setItem('authToken', idToken);
      
      // Register in backend with better error handling
      let registrationSucceeded = false;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8081/api'}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend registration failed:', errorText);
          // Don't throw error here - Firebase user was created successfully
          // Just log the backend error for debugging
        } else {
          console.log('User registered successfully in backend');
          registrationSucceeded = true;
          
          // Dispatch custom event to notify UserContext that registration completed
          window.dispatchEvent(new CustomEvent('userRegistrationComplete', {
            detail: { firebaseUid: user.uid }
          }));
        }
      } catch (backendError) {
        console.error('Backend registration error:', backendError);
        // Don't throw error here - Firebase user was created successfully
      }
      
      // Clear signup flag after backend registration attempt is complete
      // Small delay to ensure UserContext has time to refresh
      setTimeout(() => {
        setIsSigningUp(false);
      }, registrationSucceeded ? 500 : 1000);
      
      return userCredential;
    } catch (error) {
      setIsSigningUp(false);
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    // Clear all user related data
    setToken(null);
    setCurrentUser(null);
    localStorage.clear(); // Clear all localStorage instead of just authToken
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const idToken = await user.getIdToken();
          setToken(idToken);
          localStorage.setItem('authToken', idToken);
          setCurrentUser(user);
          
          // Only check/create user in backend if we're not in the middle of signup
          if (!isSigningUp) {
            // Check if user exists in backend, if not, create them
            try {
              await getUserProfile();
            } catch (error) {
              // User doesn't exist in backend, create them
              const userData = {
                firebaseUid: user.uid,
                email: user.email,
                firstName: user.displayName?.split(' ')[0] || 'User',
                lastName: user.displayName?.split(' ')[1] || 'Name',
                currency: 'ZAR',
                darkMode: false
              };
              
              try {
                await createUser(userData);
                console.log('User auto-registered in backend');
              } catch (createError) {
                console.error('Error creating user in backend:', createError);
              }
            }
          }
        } else {
          setCurrentUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    });

    // Check for existing token on component mount
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      setToken(existingToken);
    }

    return unsubscribe;
  }, [isSigningUp]);

  const value = {
    currentUser,
    token,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
