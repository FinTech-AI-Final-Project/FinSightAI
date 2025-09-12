import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
} from '@mui/icons-material';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import * as ApiService from '../services/api';
import { formatCurrency, getDateRange, expenseCategories, chartColors, exportToCSV } from '../utils/helpers';
import { useUser } from '../contexts/UserContext';
import { useErrorHandler } from '../utils/errorHandler';
import ErrorAlert from '../components/ErrorAlert';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

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

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const { error, handleError, clearError } = useErrorHandler();
  const [reportData, setReportData] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useUser();

  useEffect(() => {
    fetchReportData();
  }, [period, userProfile.currency]); // Re-fetch when period or currency changes

  useEffect(() => {
    // Listen for data changes from other components
    const handleDataUpdate = () => {
      fetchReportData();
    };

    window.addEventListener('expenseAdded', handleDataUpdate);
    window.addEventListener('expenseUpdated', handleDataUpdate);
    window.addEventListener('expenseDeleted', handleDataUpdate);
    window.addEventListener('budgetAdded', handleDataUpdate);
    window.addEventListener('budgetUpdated', handleDataUpdate);
    window.addEventListener('budgetDeleted', handleDataUpdate);
    window.addEventListener('currencyChanged', handleDataUpdate); // Listen for currency changes

    return () => {
      window.removeEventListener('expenseAdded', handleDataUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('expenseDeleted', handleDataUpdate);
      window.removeEventListener('budgetAdded', handleDataUpdate);
      window.removeEventListener('budgetUpdated', handleDataUpdate);
      window.removeEventListener('budgetDeleted', handleDataUpdate);
      window.removeEventListener('currencyChanged', handleDataUpdate); // Clean up currency listener
    };
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(period);
      
      const expensesResponse = await ApiService.getExpenses({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      });

      const budgetsResponse = await ApiService.getBudgets();

      setExpenses(expensesResponse || []);
      setBudgets(budgetsResponse || []);

      // Process data for reports
      const data = processReportData(expensesResponse || []);
      setReportData(data);

    } catch (error) {
      console.error('Error fetching report data:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (expenses) => {
    const categoryTotals = {};
    const dailyTotals = {};
    let totalSpent = 0;

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      totalSpent += amount;

      // Category totals
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount;

      // Daily totals
      const date = new Date(expense.date).toLocaleDateString();
      dailyTotals[date] = (dailyTotals[date] || 0) + amount;
    });

    return {
      totalSpent,
      categoryTotals,
      dailyTotals,
      transactionCount: expenses.length,
      averageTransaction: expenses.length > 0 ? totalSpent / expenses.length : 0,
    };
  };

  const getCategoryChartData = () => {
    const categories = Object.keys(reportData.categoryTotals || {});
    return {
      labels: categories.map(cat => expenseCategories[cat]?.name || cat),
      datasets: [{
        data: Object.values(reportData.categoryTotals || {}),
        backgroundColor: chartColors.slice(0, categories.length),
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
      }]
    };
  };

  const getDailyTrendData = () => {
    const sortedDates = Object.keys(reportData.dailyTotals || {}).sort();
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Daily Spending',
        data: sortedDates.map(date => reportData.dailyTotals[date]),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const getTopCategoriesData = () => {
    const sortedCategories = Object.entries(reportData.categoryTotals || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedCategories.map(([cat]) => expenseCategories[cat]?.name || cat),
      datasets: [{
        label: 'Amount Spent',
        data: sortedCategories.map(([,amount]) => amount),
        backgroundColor: chartColors.slice(0, sortedCategories.length),
        borderRadius: 8,
      }]
    };
  };

  const exportToPDF = () => {
    try {
      console.log('📄 Starting PDF export...');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('FinSight AI - Expense Report', pageWidth / 2, 30, { align: 'center' });
      
      // Period
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 20, 50);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Summary', 20, 80);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Spent: ${formatCurrency(reportData.totalSpent, userProfile.currency)}`, 20, 95);
      pdf.text(`Total Transactions: ${reportData.transactionCount}`, 20, 105);
      pdf.text(`Average Transaction: ${formatCurrency(reportData.averageTransaction, userProfile.currency)}`, 20, 115);
      
      // Category breakdown
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Category Breakdown', 20, 135);
      
    let yPos = 150;
    Object.entries(reportData.categoryTotals || {}).forEach(([category, amount]) => {
      const categoryName = expenseCategories[category]?.name || category;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${categoryName}: ${formatCurrency(amount, userProfile.currency)}`, 20, yPos);
      yPos += 10;
    });
    
    const filename = `finsight-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    console.log('✅ PDF export completed:', filename);
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      handleError(error);
    }
  };

  const exportToCSVReport = () => {
    try {
      console.log('📊 Starting CSV export with', expenses.length, 'expenses...');
      
      if (!expenses || expenses.length === 0) {
        alert('No expenses to export for the selected period');
        return;
      }
      
      const csvData = expenses.map(expense => ({
        Date: expense.date,
        Description: expense.description,
        Category: expenseCategories[expense.category]?.name || expense.category,
        Amount: expense.amount,
        Notes: expense.notes || '',
      }));
      
      exportToCSV(csvData, `finsight-expenses-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      handleError(error);
    }
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Reports & Analytics
        </Typography>

        <ErrorAlert error={error} />

        {/* Controls */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Time Period</InputLabel>
                  <Select
                    value={period}
                    label="Time Period"
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={exportToCSVReport}
                    size={isMobile ? "small" : "medium"}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={exportToPDF}
                    size={isMobile ? "small" : "medium"}
                  >
                    Export PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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
                        {formatCurrency(reportData.totalSpent, userProfile.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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
                        {reportData.transactionCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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
                      <DashboardIcon src="/average-daily-icon.png" alt="Average Transaction" />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Avg. Transaction
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
                        {formatCurrency(reportData.averageTransaction, userProfile.currency)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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
                      <img
                        src="/categories.png"
                        alt="Categories"
                        style={{
                          width: 32,
                          height: 32,
                          // No filter applied to keep original colors
                        }}
                      />
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 0%', 
                      minWidth: 0,
                      order: { xs: 1, md: 2 }
                    }}>
                      <Typography color="white" variant="body2" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 0.5 }}>
                        Categories
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
                        {Object.keys(reportData.categoryTotals || {}).length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts */}
        {expenses.length > 0 ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Spending by Category
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <Doughnut data={getCategoryChartData()} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Top Categories
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <Bar data={getTopCategoriesData()} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Spending Trend
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <Line data={getDailyTrendData()} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <img
              src="/report.png"
              alt="No data"
              style={{
                width: 64,
                height: 64,
                opacity: 0.5,
                marginBottom: 16,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No data available for selected period
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add some expenses to see your analytics and reports
            </Typography>
          </Paper>
        )}

        {/* Category Breakdown Table */}
        {Object.keys(reportData.categoryTotals || {}).length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Category Breakdown
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {Object.entries(reportData.categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount], index) => {
                  const categoryInfo = expenseCategories[category] || { name: category, icon: '📝' };
                  const percentage = (amount / reportData.totalSpent) * 100;
                  
                  return (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ mr: 1, fontSize: '20px' }}>{categoryInfo.icon}</Box>
                          <Typography variant="body1" fontWeight={500}>
                            {categoryInfo.name}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(amount, userProfile.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          backgroundColor: theme.palette.grey[200],
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: chartColors[index % chartColors.length],
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Box>
  );
};

export default Reports;
