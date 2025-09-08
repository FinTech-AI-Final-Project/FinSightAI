import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
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
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useUser();

  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.month);
  const [selectedYear, setSelectedYear] = useState(currentMonth.year);

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
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
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, userProfile.currency]); // Re-fetch when month/year or currency changes

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
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
          
          {/* Month Navigation */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={handlePreviousMonth} size={isMobile ? "small" : "medium"}>
              <ChevronLeft />
            </IconButton>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ minWidth: isMobile ? 120 : 160, textAlign: 'center' }}>
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Typography>
            <IconButton onClick={handleNextMonth} size={isMobile ? "small" : "medium"}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* AI Tips Panel */}
        <AITipsPanel expenses={expenses} budgets={budgets} />

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8 }}>
                        Total Spent
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="white" 
                        fontWeight={600}
                        sx={{ fontSize: '1.75rem', fontWeight: 700 }}
                      >
                        {formatCurrency(totalSpent, userProfile.currency)}
                      </Typography>
                    </Box>
                    <Receipt sx={{ color: 'white', opacity: 0.8, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8 }}>
                        Total Budget
                      </Typography>
                      <Typography variant="h5" color="white" fontWeight={600}>
                        {formatCurrency(budgets.reduce((sum, budget) => sum + parseFloat(budget.monthlyLimit), 0), userProfile.currency)}
                      </Typography>
                    </Box>
                    <AccountBalance sx={{ color: 'white', opacity: 0.8, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8 }}>
                        Transactions
                      </Typography>
                      <Typography variant="h5" color="white" fontWeight={600}>
                        {expenses.length}
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ color: 'white', opacity: 0.8, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8 }}>
                        Avg. Daily
                      </Typography>
                      <Typography variant="h5" color="white" fontWeight={600}>
                        {formatCurrency(totalSpent / new Date().getDate(), userProfile.currency)}
                      </Typography>
                    </Box>
                    <TrendingDown sx={{ color: 'white', opacity: 0.8, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
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
          </Grid>

          <Grid item xs={12} md={6}>
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
          </Grid>
        </Grid>

        {/* Budget Progress */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Budget Overview
            </Typography>
            {budgets.length > 0 ? (
              <Grid container spacing={2}>
                {budgets.slice(0, 6).map((budget, index) => {
                  const progress = (budget.currentSpent / budget.monthlyLimit) * 100;
                  const isOverBudget = progress > 100;
                  const isWarning = progress > 80;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={budget.id}>
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
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Alert severity="info">
                No budgets set up yet. Create budgets to track your spending goals!
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
