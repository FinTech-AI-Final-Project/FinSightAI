import React from 'react';

/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Convert technical errors to user-friendly messages
 * @param {Error|string|object} error - The error to process
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Extract error message from various error formats
  let errorMsg = '';
  
  if (typeof error === 'string') {
    errorMsg = error;
  } else if (error?.response?.data) {
    if (typeof error.response.data === 'string') {
      errorMsg = error.response.data;
    } else if (error.response.data.message) {
      errorMsg = error.response.data.message;
    } else if (error.response.data.error) {
      errorMsg = error.response.data.error;
    } else {
      errorMsg = JSON.stringify(error.response.data);
    }
  } else if (error?.message) {
    errorMsg = error.message;
  } else if (error?.toString) {
    errorMsg = error.toString();
  } else {
    errorMsg = 'An unexpected error occurred';
  }

  // Convert technical errors to user-friendly messages
  
  // Firebase Authentication Errors
  if (errorMsg.includes('auth/user-not-found')) {
    return 'No account found with this email address. Please check your email or create a new account.';
  }
  
  if (errorMsg.includes('auth/wrong-password') || errorMsg.includes('auth/invalid-credential')) {
    return 'Incorrect password. Please try again or use "Forgot Password" to reset it.';
  }
  
  if (errorMsg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead or use a different email.';
  }
  
  if (errorMsg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  
  if (errorMsg.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
  }
  
  if (errorMsg.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a few minutes before trying again.';
  }
  
  if (errorMsg.includes('auth/requires-recent-login')) {
    return 'For security, please sign out and sign in again before making this change.';
  }
  
  if (errorMsg.includes('auth/user-disabled')) {
    return 'This account has been disabled. Please contact support for assistance.';
  }
  
  if (errorMsg.includes('auth/network-request-failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  // Budget and Business Logic Errors
  if (errorMsg.includes('must create a budget') && errorMsg.includes('before adding expenses')) {
    return 'Please create a budget for this category first. Go to the Budgets page to set up a budget before adding expenses.';
  }
  
  if (errorMsg.includes('You must create a budget for') && errorMsg.includes('in') && errorMsg.includes('before adding expenses')) {
    // Extract category and month from the detailed backend message
    const match = errorMsg.match(/You must create a budget for (.+) in (.+) before adding expenses/);
    if (match) {
      return `Please create a budget for ${match[1]} in ${match[2]} first. Go to the Budgets page to set up your budget.`;
    }
    return 'Please create a budget for this category and month first. Go to the Budgets page to set up your budget.';
  }
  
  if (errorMsg.includes('budget') && errorMsg.includes('category') && errorMsg.includes('month')) {
    return 'Please create a budget for this category first. Go to the Budgets page to set up a budget before adding expenses.';
  }
  
  if (errorMsg.includes('budget') && errorMsg.includes('exists') && errorMsg.includes('month')) {
    return 'A budget for this category already exists for the selected month. Please edit the existing budget instead.';
  }
  
  if (errorMsg.includes('User not found')) {
    return 'Your account information could not be found. Please sign out and sign in again.';
  }
  
  if (errorMsg.includes('Unauthorized to update') || errorMsg.includes('Unauthorized to delete')) {
    return 'You do not have permission to modify this item. It may belong to another user.';
  }
  
  if (errorMsg.includes('Expense not found') || errorMsg.includes('Budget not found')) {
    return 'The requested item was not found. It may have been deleted or you may not have access to it.';
  }
  
  if (errorMsg.includes('User already exists with this email')) {
    return 'An account with this email already exists. Please sign in instead or use a different email address.';
  }
  
  if (errorMsg.includes('Failed to create user')) {
    return 'Account creation failed. Please try again or contact support if the problem persists.';
  }
  
  // Database Constraint Errors
  if (errorMsg.includes('value too long') && (errorMsg.includes('255') || errorMsg.includes('1000'))) {
    return 'The text you entered is too long. Please shorten your description and try again.';
  }
  
  if (errorMsg.includes('violates check constraint') && errorMsg.includes('category')) {
    return 'Invalid category selected. Please choose a valid category from the dropdown menu.';
  }
  
  if (errorMsg.includes('duplicate key value') || errorMsg.includes('already exists')) {
    return 'This item already exists. Please modify your entry or choose different values.';
  }
  
  if (errorMsg.includes('foreign key constraint') || errorMsg.includes('referenced')) {
    return 'This action cannot be completed because other items depend on this data. Please remove dependent items first.';
  }
  
  if (errorMsg.includes('not-null') || errorMsg.includes('cannot be null')) {
    return 'All required fields must be filled in. Please complete the form and try again.';
  }
  
  // Network and API Errors
  if (errorMsg.includes('Network Error') || errorMsg.includes('ERR_NETWORK') || errorMsg.includes('ECONNREFUSED')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (errorMsg.includes('CORS') || errorMsg.includes('cross-origin')) {
    return 'Connection blocked by browser security. Please try refreshing the page.';
  }
  
  // HTTP Status Errors
  if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
    return 'Your session has expired. Please refresh the page and sign in again.';
  }
  
  if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
    return 'You do not have permission to perform this action. Please contact support if needed.';
  }
  
  if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
    return 'The requested item was not found. It may have been deleted or moved.';
  }
  
  if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
    return 'Invalid data provided. Please check all fields are filled correctly and try again.';
  }
  
  if (errorMsg.includes('409') || errorMsg.includes('Conflict')) {
    return 'This action conflicts with existing data. Please refresh the page and try again.';
  }
  
  if (errorMsg.includes('422') || errorMsg.includes('Unprocessable')) {
    return 'The data provided is not valid. Please check your entries and try again.';
  }
  
  if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
    return 'Server error occurred. Please try again in a moment. If the problem persists, contact support.';
  }
  
  if (errorMsg.includes('502') || errorMsg.includes('Bad Gateway')) {
    return 'Server is temporarily unavailable. Please try again in a few minutes.';
  }
  
  if (errorMsg.includes('503') || errorMsg.includes('Service Unavailable')) {
    return 'Service is temporarily down for maintenance. Please try again later.';
  }
  
  if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
    return 'The request took too long to complete. Please try again with a stable internet connection.';
  }
  
  // File Upload Errors
  if (errorMsg.includes('file too large') || errorMsg.includes('size limit')) {
    return 'File is too large. Please choose a smaller file and try again.';
  }
  
  if (errorMsg.includes('invalid file type') || errorMsg.includes('unsupported format')) {
    return 'File type not supported. Please use a supported file format.';
  }
  
  // Payment/Financial Errors
  if (errorMsg.includes('insufficient funds') || errorMsg.includes('balance')) {
    return 'Insufficient balance for this transaction. Please check your account balance.';
  }
  
  if (errorMsg.includes('currency') && errorMsg.includes('conversion')) {
    return 'Currency conversion failed. Please try again or contact support.';
  }
  
  // AI Service and External API Errors
  if (errorMsg.includes('AI Agent API') || errorMsg.includes('Error executing AI-generated query')) {
    return 'AI assistant is temporarily unavailable. Please try again in a moment.';
  }
  
  if (errorMsg.includes('Blockchair') || errorMsg.includes('crypto') || errorMsg.includes('cryptocurrency')) {
    return 'Cryptocurrency data is temporarily unavailable. Please try again later.';
  }
  
  if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
    return 'Service is busy. Please wait a moment before trying again.';
  }
  
  // General Firebase Errors
  if (errorMsg.includes('Firebase') || errorMsg.includes('firebase')) {
    return 'Authentication service error. Please try signing out and back in.';
  }
  
  // Return simplified version for other errors (remove technical jargon)
  if (errorMsg.length > 150) {
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
  
  // Clean up common technical terms and make message user-friendly
  let cleanedMsg = errorMsg
    .replace(/\[.*?\]/g, '') // Remove [technical details]
    .replace(/\{.*?\}/g, '') // Remove {technical objects}
    .replace(/Error:/gi, '') // Remove "Error:" prefix
    .replace(/Exception:/gi, '') // Remove "Exception:" prefix  
    .replace(/could not execute statement/gi, '') // Remove Hibernate messages
    .replace(/org\..*?:/g, '') // Remove Java package names
    .replace(/com\..*?:/g, '') // Remove Java package names
    .replace(/java\..*?:/g, '') // Remove Java package names
    .replace(/javax\..*?:/g, '') // Remove Java package names
    .replace(/at .*?\n/g, '') // Remove stack trace lines
    .replace(/Caused by:/gi, '') // Remove "Caused by:"
    .replace(/\n\s*at\s+/g, ' ') // Remove newlines with stack traces
    .replace(/null/gi, 'missing') // Replace "null" with "missing"
    .replace(/constraint/gi, 'rule') // Replace "constraint" with "rule"
    .replace(/violates/gi, 'breaks') // Replace "violates" with "breaks"
    .replace(/SQLException/gi, 'database error') // Replace technical DB terms
    .replace(/PSQLException/gi, 'database error') // Replace PostgreSQL terms
    .replace(/PreparedStatementCallback/gi, '') // Remove Hibernate terms
    .replace(/StatementCallback/gi, '') // Remove Hibernate terms
    .trim();
  
  // If cleaned message is empty or too technical, provide generic message
  if (!cleanedMsg || cleanedMsg.length < 10 || /^[A-Z_]+$/.test(cleanedMsg)) {
    return 'An error occurred while processing your request. Please try again.';
  }
  
  // Capitalize first letter and ensure proper punctuation
  cleanedMsg = cleanedMsg.charAt(0).toUpperCase() + cleanedMsg.slice(1);
  if (!cleanedMsg.endsWith('.') && !cleanedMsg.endsWith('!') && !cleanedMsg.endsWith('?')) {
    cleanedMsg += '.';
  }
  
  return cleanedMsg;
};

/**
 * Get error severity level for display purposes
 * @param {Error|string|object} error - The error to analyze
 * @returns {string} MUI Alert severity ('error', 'warning', 'info')
 */
export const getErrorSeverity = (error) => {
  const errorMsg = getErrorMessage(error).toLowerCase();
  
  // Info level - helpful guidance or instructions
  if (errorMsg.includes('please create a budget') || 
      errorMsg.includes('go to the budgets page') ||
      errorMsg.includes('choose a valid category') ||
      errorMsg.includes('fill in all required') ||
      errorMsg.includes('already exists')) {
    return 'info';
  }
  
  // Warning level - session/auth issues that require user action but aren't critical
  if (errorMsg.includes('session has expired') || 
      errorMsg.includes('sign in again') ||
      errorMsg.includes('sign out and sign in') ||
      errorMsg.includes('refresh the page') ||
      errorMsg.includes('too many failed attempts') ||
      errorMsg.includes('for security') ||
      errorMsg.includes('permission')) {
    return 'warning';
  }
  
  // Warning level - temporary issues
  if (errorMsg.includes('temporarily') ||
      errorMsg.includes('maintenance') ||
      errorMsg.includes('try again later') ||
      errorMsg.includes('wait a few minutes')) {
    return 'warning';
  }
  
  // Error level - all other errors (network, validation, server errors)
  return 'error';
};

/**
 * Hook for managing error state in components
 * @returns {object} Error state management functions
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState('');
  const [dialogError, setDialogError] = React.useState('');
  
  const handleError = React.useCallback((err, useDialog = false) => {
    const message = getErrorMessage(err);
    if (useDialog) {
      setDialogError(message);
    } else {
      setError(message);
    }
    console.error('Error occurred:', err);
  }, []);
  
  const clearError = React.useCallback((dialog = false) => {
    if (dialog) {
      setDialogError('');
    } else {
      setError('');
    }
  }, []);
  
  const clearAllErrors = React.useCallback(() => {
    setError('');
    setDialogError('');
  }, []);
  
  return {
    error,
    dialogError,
    handleError,
    clearError,
    clearAllErrors,
    setError,
    setDialogError
  };
};