import { Capacitor } from '@capacitor/core';

// 🌐 Determine API base URL based on platform
const getApiUrl = () => {
  const isNative = Capacitor.isNativePlatform();
  console.log('📱 Platform check - isNative:', isNative);
  
  if (isNative) {
    // Use HTTP for mobile (with cleartext traffic allowed)
    const mobileUrl = 'http://192.168.106.25:8081/api';
    console.log('📱 Using mobile API URL:', mobileUrl);
    return mobileUrl;
  } else {
    const webUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
    console.log('💻 Using web API URL:', webUrl);
    return webUrl;
  }
};

const API_BASE_URL = getApiUrl();
console.log('🔗 Final API_BASE_URL:', API_BASE_URL);

// 🛠️ Helper function to make API requests with comprehensive logging
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🚀 Making API request to: ${url}`);
  console.log('📊 Request options:', options);
  
  // Get auth token from localStorage
  const authToken = localStorage.getItem('authToken');
  console.log('🔐 Auth token available:', !!authToken);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };
  
  console.log('⚙️ Final request config:', config);
  
  try {
    const response = await fetch(url, config);
    console.log(`✅ Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if the response is meant to be JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }
    
    // For non-JSON responses, return the text
    const data = await response.text();
    console.log('📦 Response data:', data);
    return data;
  } catch (error) {
    console.error(`💥 API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// 👤 User API functions
export const getUserProfile = async () => {
  return apiRequest('/users/profile');
};

export const updateUserProfile = async (userData) => {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const createUser = async (userData) => {
  return apiRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// 💰 Expense API functions
export const getExpenses = async (params = {}) => {
  let endpoint = '/expenses';
  if (params.startDate || params.endDate) {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    endpoint += `?${queryParams}`;
  }
  return apiRequest(endpoint);
};

export const createExpense = async (expenseData) => {
  return apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
};

export const updateExpense = async (id, expenseData) => {
  return apiRequest(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });
};

export const deleteExpense = async (id) => {
  return apiRequest(`/expenses/${id}`, {
    method: 'DELETE',
  });
};

// 📊 Budget API functions
export const getBudgets = async (params = {}) => {
  let endpoint = '/budgets';
  if (params.month || params.year) {
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year);
    endpoint += `?${queryParams}`;
  }
  return apiRequest(endpoint);
};

export const createBudget = async (budgetData) => {
  return apiRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify(budgetData),
  });
};

export const updateBudget = async (id, budgetData) => {
  return apiRequest(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(budgetData),
  });
};

export const deleteBudget = async (id) => {
  return apiRequest(`/budgets/${id}`, {
    method: 'DELETE',
  });
};

// 📈 Reports API functions
export const getFinancialReport = async (startDate, endDate) => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });
  return apiRequest(`/reports/financial?${params}`);
};

export const getExpensesByCategory = async () => {
  return apiRequest('/reports/expenses-by-category');
};

export const getMonthlyTrends = async () => {
  return apiRequest('/reports/monthly-trends');
};

// 🔍 Receipt scanning
export const uploadReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  
  return apiRequest('/receipts/upload', {
    method: 'POST',
    body: formData,
    headers: {}, // Remove Content-Type to let browser set it for FormData
  });
};

// 🤖 AI Tips functions
export const getDailyTip = async (userCurrency = 'USD') => {
  // Map currency to country/region for location-based tips
  const currencyToCountry = {
    'ZAR': 'South Africa',
    'USD': 'United States', 
    'EUR': 'Europe',
    'GBP': 'United Kingdom',
    'JPY': 'Japan',
    'AUD': 'Australia',
    'CAD': 'Canada',
    'CHF': 'Switzerland',
    'CNY': 'China',
    'INR': 'India',
    'BRL': 'Brazil'
  };

  const country = currencyToCountry[userCurrency] || 'Global';
  
  try {
    console.log(`🌍 Fetching AI tips for: ${country} (${userCurrency})`);
    
    // Try personalized tips first
    try {
      console.log('🎯 Attempting to get personalized AI tip...');
      const personalizedResponse = await apiRequest('/ai-tips/personalized', {
        method: 'GET'
      });
      
      if (personalizedResponse && personalizedResponse.tip) {
        console.log('✅ Got personalized AI tip:', personalizedResponse.tip);
        return {
          ...personalizedResponse,
          personalized: true,
          currency: userCurrency,
          country: country
        };
      }
    } catch (personalizedError) {
      console.log('⚠️ Personalized tips not available, falling back to daily tips');
    }
    
    // Fallback to daily tips with auth
    const response = await apiRequest(`/ai-tips/daily?currency=${userCurrency}&country=${encodeURIComponent(country)}`, {
      method: 'GET'
    });
    return {
      ...response,
      personalized: false,
      currency: userCurrency,
      country: country
    };
  } catch (error) {
    console.error('Error fetching daily tip:', error);
    // Return fallback tip based on currency/location
    return {
      tip: getFallbackTip(userCurrency),
      category: 'general',
      currency: userCurrency,
      country: currencyToCountry[userCurrency] || 'Global',
      personalized: false
    };
  }
};

const getFallbackTip = (currency) => {
  const fallbackTips = {
    'ZAR': '🇿🇦 Consider investing in South African ETFs like Satrix Top 40 (STX40) or opening a Tax-Free Savings Account (TFSA). You can invest R36,000 annually tax-free for long-term growth.',
    'EUR': 'Take advantage of European banking benefits and consider SEPA transfers for cost-effective international transactions within Europe. European investment funds offer good diversification opportunities.',
    'GBP': 'With Brexit impacts on the UK economy, consider diversifying investments and explore ISA accounts for tax-efficient savings. Premium bonds offer a safe investment option.',
    'USD': 'Consider dollar-cost averaging into S&P 500 index funds and take advantage of 401(k) employer matching if available. Roth IRA contributions can provide tax-free growth.',
    'JPY': 'Japan offers unique savings programs and investment opportunities. Consider Japanese Government Bonds (JGBs) for stability and NISA accounts for tax-advantaged investing.',
    'AUD': 'Australia\'s superannuation system is excellent for retirement planning. Consider salary sacrificing and diversifying with Australian and international ETFs.',
    'CAD': 'Take advantage of Tax-Free Savings Accounts (TFSA) and Registered Retirement Savings Plans (RRSP) in Canada. Both offer excellent tax benefits for long-term wealth building.',
    'default': '💡 Track every expense for better financial awareness - small purchases add up faster than you think! Consider automating your savings and investing in diversified index funds.'
  };
  
  return fallbackTips[currency] || fallbackTips['default'];
};

// 🖼️ Profile picture functions
export const updateProfilePicture = async (base64Image) => {
  return apiRequest('/users/profile/picture', {
    method: 'PUT',
    body: JSON.stringify({ profilePicture: base64Image }),
  });
};

// 🗑️ User account functions
export const deleteUser = async () => {
  const response = await apiRequest('/users/profile', {
    method: 'DELETE',
  });
  // Return true if the deletion was successful
  return response === "User deleted successfully";
};

// 🎯 Multiple AI Tips function
export const getMultipleTips = async () => {
  try {
    console.log('🎯 Fetching multiple AI tips...');
    const response = await apiRequest('/ai-tips/multiple', {
      method: 'GET'
    });
    
    if (response && response.tips) {
      console.log('✅ Got multiple AI tips:', response.tips);
      return response;
    }
    
    // Fallback to single tip if multiple tips not available
    const singleTip = await getDailyTip();
    return {
      tips: [singleTip.tip],
      personalized: singleTip.personalized
    };
  } catch (error) {
    console.error('🚨 Error fetching multiple AI tips:', error);
    const fallbackTip = await getDailyTip();
    return {
      tips: [fallbackTip.tip],
      personalized: false,
      error: true
    };
  }
};

// 🤖 AI Chatbot function
export const sendChatMessage = async (message, userContext = {}) => {
  try {
    console.log('🤖 Sending chat message:', message);
    const response = await apiRequest('/ai-chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        currency: userContext.currency || 'ZAR',
        region: userContext.region || 'ZA',
        userContext
      })
    });
    
    if (response && response.reply) {
      console.log('✅ Got chatbot reply:', response.reply);
      return response;
    }
    
    throw new Error('No reply received from chatbot');
  } catch (error) {
    console.error('🚨 Error sending chat message:', error);
    throw error;
  }
};

// Export the apiRequest function for use in components
export { apiRequest };

console.log('✨ API service initialized with base URL:', API_BASE_URL);
