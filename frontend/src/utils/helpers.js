export const expenseCategories = {
  FOOD_DINING: { name: 'Food & Dining', icon: '🍽️', color: '#ff6b6b' },
  TRANSPORTATION: { name: 'Transportation', icon: '🚗', color: '#4ecdc4' },
  SHOPPING: { name: 'Shopping', icon: '🛍️', color: '#45b7d1' },
  ENTERTAINMENT: { name: 'Entertainment', icon: '🎬', color: '#f39c12' },
  BILLS_UTILITIES: { name: 'Bills & Utilities', icon: '⚡', color: '#e74c3c' },
  HEALTHCARE: { name: 'Healthcare', icon: '🏥', color: '#2ecc71' },
  EDUCATION: { name: 'Education', icon: '📚', color: '#9b59b6' },
  TRAVEL: { name: 'Travel', icon: '✈️', color: '#1abc9c' },
  GROCERIES: { name: 'Groceries', icon: '🛒', color: '#27ae60' },
  PERSONAL_CARE: { name: 'Personal Care', icon: '💄', color: '#e91e63' },
  BUSINESS: { name: 'Business', icon: '💼', color: '#34495e' },
  GIFTS_DONATIONS: { name: 'Gifts & Donations', icon: '🎁', color: '#f1c40f' },
  INVESTMENTS: { name: 'Investments', icon: '📈', color: '#8e44ad' },
  CRYPTO: { name: 'Crypto & Digital Assets', icon: '₿', color: '#f7931a' },
  OTHER: { name: 'Other', icon: '📝', color: '#95a5a6' },
};

export const formatCurrency = (amount, currency = 'ZAR') => {
  const currencyMap = {
    'ZAR': { locale: 'en-ZA', symbol: 'R' },
    'USD': { locale: 'en-US', symbol: '$' },
    'EUR': { locale: 'en-EU', symbol: '€' },
    'GBP': { locale: 'en-GB', symbol: '£' }
  };

  const config = currencyMap[currency] || currencyMap['ZAR'];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getCurrencySymbol = (currency = 'ZAR') => {
  const symbols = {
    'ZAR': 'R',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  return symbols[currency] || 'R';
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateForInput = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const getCurrentMonth = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
};

export const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
      };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        startDate: weekStart,
        endDate: weekEnd,
      };
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      };
    default:
      return getCurrentMonth();
  }
};

export const calculateBudgetProgress = (spent, limit) => {
  if (!limit || limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

export const getBudgetStatus = (spent, limit) => {
  const percentage = calculateBudgetProgress(spent, limit);
  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'warning';
  if (percentage >= 60) return 'caution';
  return 'good';
};

export const exportToCSV = (data, filename) => {
  try {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    console.log('📊 Exporting CSV with', data.length, 'rows');
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV export triggered for file:', filename);
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    alert('Failed to export CSV: ' + error.message);
  }
};

export const chartColors = [
  '#1976d2', '#ff9800', '#4caf50', '#f44336', '#9c27b0',
  '#2196f3', '#ff5722', '#795548', '#607d8b', '#e91e63',
  '#ffeb3b', '#00bcd4', '#8bc34a', '#ffc107', '#3f51b5'
];

export const generateChartData = (expenses, type = 'category') => {
  if (type === 'category') {
    const categoryData = {};
    expenses.forEach(expense => {
      const category = expense.category;
      categoryData[category] = (categoryData[category] || 0) + parseFloat(expense.amount);
    });

    return {
      labels: Object.keys(categoryData).map(cat => expenseCategories[cat]?.name || cat),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: Object.keys(categoryData).map((_, index) => chartColors[index % chartColors.length]),
        borderWidth: 2,
      }]
    };
  }

  if (type === 'daily') {
    const dailyData = {};
    expenses.forEach(expense => {
      const date = formatDate(expense.date);
      dailyData[date] = (dailyData[date] || 0) + parseFloat(expense.amount);
    });

    return {
      labels: Object.keys(dailyData),
      datasets: [{
        label: 'Daily Expenses',
        data: Object.values(dailyData),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  }

  return null;
};
