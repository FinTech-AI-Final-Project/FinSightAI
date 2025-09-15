import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import * as ApiService from '../services/api';
import { formatCurrency, getCurrentMonth, expenseCategories, chartColors } from '../utils/helpers';
import { useUser } from '../contexts/UserContext';
import AITipsPanel from '../components/AITipsPanel';
import { useErrorHandler } from '../utils/errorHandler';
import ErrorAlert from '../components/ErrorAlert';

// Custom Icon Component for dashboard cards
const DashboardIcon = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: 32,
      height: 32,
      // No filter applied to keep original colors
      opacity: 0.9,
    }}
  />
);

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState({});
  const { error, handleError, clearError } = useErrorHandler();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile, initialized } = useUser();

  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.month);
  const [selectedYear, setSelectedYear] = useState(currentMonth.year);

  const handleDateChange = (newDate) => {
    if (newDate) {
      setSelectedMonth(newDate.getMonth() + 1);
      setSelectedYear(newDate.getFullYear());
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!initialized || !userProfile) {
      console.log('Dashboard: Skipping data fetch - user not initialized or profile not available');
      return;
    }

    try {
      setLoading(true);
      clearError(); // Clear any previous errors
      
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      console.log('Dashboard: Fetching data for period:', { startDate, endDate, month: selectedMonth, year: selectedYear });
      
      // Fetch selected month's expenses
      const expensesResponse = await ApiService.getExpenses({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      
      // Fetch selected month's budgets
      const budgetsResponse = await ApiService.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      });

      console.log('Dashboard: Data fetched successfully', { 
        expenses: expensesResponse?.length, 
        budgets: budgetsResponse?.length 
      });

      setExpenses(expensesResponse || []);
      setBudgets(budgetsResponse || []);

      // Calculate total spent
      const total = expensesResponse?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
      setTotalSpent(total);

      // Process daily expenses for chart
      const daily = {};
      expensesResponse?.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daily[date] = (daily[date] || 0) + parseFloat(expense.amount);
      });
      setDailyExpenses(daily);

    } catch (error) {
      console.error('Dashboard: Error fetching dashboard data:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, initialized, userProfile]); // handleError and clearError are memoized with useCallback

  useEffect(() => {
    if (initialized && userProfile) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, initialized, userProfile]); // Re-fetch when user is initialized and profile available

  useEffect(() => {
    // Listen for data changes from other components
    const handleDataUpdate = () => {
      fetchDashboardData();
    };

    window.addEventListener('expenseAdded', handleDataUpdate);
    window.addEventListener('expenseUpdated', handleDataUpdate);
    window.addEventListener('expenseDeleted', handleDataUpdate);
    window.addEventListener('budgetAdded', handleDataUpdate);
    window.addEventListener('budgetUpdated', handleDataUpdate);
    window.addEventListener('budgetDeleted', handleDataUpdate);
    window.addEventListener('currencyChanged', handleDataUpdate);

    return () => {
      window.removeEventListener('expenseAdded', handleDataUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('expenseDeleted', handleDataUpdate);
      window.removeEventListener('budgetAdded', handleDataUpdate);
      window.removeEventListener('budgetUpdated', handleDataUpdate);
      window.removeEventListener('budgetDeleted', handleDataUpdate);
      window.removeEventListener('currencyChanged', handleDataUpdate);
    };
  }, [fetchDashboardData]); // Include fetchDashboardData dependency

  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
    });

    return {
      labels: Object.keys(categoryTotals).map(cat => expenseCategories[cat]?.name || cat),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: chartColors.slice(0, Object.keys(categoryTotals).length),
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
      }]
    };
  };

  const getDailyChartData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
    }

    return {
      labels: last7Days,
      datasets: [{
        label: 'Daily Spending',
        data: last7Days.map(date => dailyExpenses[date] || 0),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, userProfile.currency);
          }
        }
      }
    },
  };

  // Show loading if user context is not initialized yet or if component is loading
  if (!initialized || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Show loading if userProfile is not available yet (fallback check)
  if (!userProfile) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Dashboard
          </Typography>
          
          <DatePicker
            views={['year', 'month']}
            label="Budget Month"
            value={new Date(selectedYear, selectedMonth - 1)}
            onChange={handleDateChange}
            defaultCalendarMonth={new Date(selectedYear, selectedMonth - 1)}
            openTo="month"
            sx={{ minWidth: 200 }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              }
            }}
          />
        </Box>

        <ErrorAlert error={error} />

        {/* AI Tips Panel */}
        <AITipsPanel expenses={expenses} budgets={budgets} />

        {/* Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 } }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 25%' } }}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', minHeight: { xs: 120, sm: 140 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box 
                    display="flex" 
                    width="100%" 
                    sx={{ 
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'flex-start' },
                      gap: { xs: 1, md: 1.5 }
                    }}
                  >
                    <Box sx={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      order: { xs: 2, md: 1 }
                    }}>
                      <DashboardIcon src="/total-spent-icon.png" alt="Total Spent" />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Total Spent
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="white" 
                        fontWeight={600}
                        sx={{ 
                          fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, 
                          fontWeight: 700,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCurrency(totalSpent, userProfile.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 25%' } }}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', minHeight: { xs: 120, sm: 140 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box 
                    display="flex" 
                    width="100%" 
                    sx={{ 
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'flex-start' },
                      gap: { xs: 1, md: 1.5 }
                    }}
                  >
                    <Box sx={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      order: { xs: 2, md: 1 }
                    }}>
                      <DashboardIcon src="/total-budget-icon.png" alt="Total Budget" />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Total Budget
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="white" 
                        fontWeight={600}
                        sx={{ 
                          fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, 
                          fontWeight: 700,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCurrency(budgets.reduce((sum, budget) => sum + parseFloat(budget.monthlyLimit), 0), userProfile.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 25%' } }}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', minHeight: { xs: 120, sm: 140 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box 
                    display="flex" 
                    width="100%" 
                    sx={{ 
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'flex-start' },
                      gap: { xs: 1, md: 1.5 }
                    }}
                  >
                    <Box sx={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      order: { xs: 2, md: 1 }
                    }}>
                      <DashboardIcon src="/transaction-icons.png" alt="Transactions" />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Transactions
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="white" 
                        fontWeight={600}
                        sx={{ 
                          fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, 
                          fontWeight: 700,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {expenses.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 25%' } }}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', minHeight: { xs: 120, sm: 140 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box 
                    display="flex" 
                    width="100%" 
                    sx={{ 
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'flex-start' },
                      gap: { xs: 1, md: 1.5 }
                    }}
                  >
                    <Box sx={{ 
                      flexShrink: 0, 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      order: { xs: 2, md: 1 }
                    }}>
                      <DashboardIcon src="/average-daily-icon.png" alt="Average Daily" />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Avg. Daily
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="white" 
                        fontWeight={600}
                        sx={{ 
                          fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, 
                          fontWeight: 700,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCurrency(totalSpent / new Date().getDate(), userProfile.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>

        {/* Charts */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Spending by Category
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    {expenses.length > 0 ? (
                      <Doughnut data={getCategoryData()} options={chartOptions} />
                    ) : (
                      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                        <Typography color="text.secondary">No expenses recorded yet</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Daily Spending Trend
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <Line data={getDailyChartData()} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Budget Progress */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Budget Overview
            </Typography>
            {budgets.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row', md: 'row' }, flexWrap: 'wrap', gap: 2 }}>
                {budgets.slice(0, 6).map((budget, index) => {
                  const progress = (budget.currentSpent / budget.monthlyLimit) * 100;
                  const isOverBudget = progress > 100;
                  const isWarning = progress > 80;
                  
                  return (
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' }, minWidth: 0 }} key={budget.id}>
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight={500}>
                            {expenseCategories[budget.category]?.name || budget.category}
                          </Typography>
                          <Chip
                            label={`${Math.round(progress)}%`}
                            size="small"
                            color={isOverBudget ? 'error' : isWarning ? 'warning' : 'success'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {formatCurrency(budget.currentSpent, userProfile.currency)} / {formatCurrency(budget.monthlyLimit, userProfile.currency)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          color={isOverBudget ? 'error' : isWarning ? 'warning' : 'success'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Alert severity="info">
                No budgets set up yet. Create budgets to track your spending goals!
              </Alert>
            )}
          </CardContent>
        </Card>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
