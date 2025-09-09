import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Menu,
  CircularProgress,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  Warning,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import * as ApiService from '../services/api';
import { formatCurrency, expenseCategories, getCurrentMonth, getCurrencySymbol } from '../utils/helpers';
import { useUser } from '../contexts/UserContext';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useUser();

  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.month);
  const [selectedYear, setSelectedYear] = useState(currentMonth.year);
  
  const [formData, setFormData] = useState({
    category: '',
    monthlyLimit: '',
    month: selectedMonth,
    year: selectedYear,
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, userProfile.currency]); // Re-fetch when currency or month/year changes

  useEffect(() => {
    // Listen for currency changes from other components
    const handleCurrencyChange = () => {
      fetchBudgets();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, [fetchBudgets]);

  const handleCreateBudget = async () => {
    try {
      const budgetData = {
        ...formData,
        monthlyLimit: parseFloat(formData.monthlyLimit),
      };

      if (editingBudget) {
        await ApiService.updateBudget(editingBudget.id, budgetData);
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('budgetUpdated'));
      } else {
        await ApiService.createBudget(budgetData);
        // Dispatch create event
        window.dispatchEvent(new CustomEvent('budgetAdded'));
      }

      await fetchBudgets();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving budget:', error);
      setError('Failed to save budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await ApiService.deleteBudget(budgetId);
      await fetchBudgets();
      handleCloseMenu();
      // Dispatch delete event
      window.dispatchEvent(new CustomEvent('budgetDeleted'));
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
    }
  };

  const handleOpenDialog = (budget = null) => {
    setEditingBudget(budget);
    if (budget) {
      setFormData({
        category: budget.category,
        monthlyLimit: budget.monthlyLimit.toString(),
        month: budget.month,
        year: budget.year,
      });
    } else {
      setFormData({
        category: '',
        monthlyLimit: '',
        month: selectedMonth,
        year: selectedYear,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
  };

  const handleMenu = (event, budget) => {
    setAnchorEl(event.currentTarget);
    setSelectedBudget(budget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedBudget(null);
  };

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

  const getBudgetStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return { status: 'over', color: 'error' };
    if (percentage >= 80) return { status: 'warning', color: 'warning' };
    if (percentage >= 60) return { status: 'caution', color: 'info' };
    return { status: 'good', color: 'success' };
  };

  const BudgetCard = ({ budget }) => {
    const categoryInfo = expenseCategories[budget.category] || { name: budget.category, icon: '📝' };
    const progress = Math.min((budget.currentSpent / budget.monthlyLimit) * 100, 100);
    const budgetStatus = getBudgetStatus(budget.currentSpent, budget.monthlyLimit);
    const remaining = budget.monthlyLimit - budget.currentSpent;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: isMobile ? 1 : 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            mx: { xs: 0, sm: 'auto' },
            cursor: isMobile ? 'default' : 'pointer',
            '&:hover': {
              boxShadow: isMobile ? undefined : '0 8px 16px rgba(0,0,0,0.15)',
            }
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} sx={{ width: '100%' }}>
              <Box display="flex" alignItems="center" sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '16px', sm: '20px' },
                    flexShrink: 0,
                  }}
                >
                  {categoryInfo.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    fontWeight={600}
                    sx={{ 
                      mb: 0.5,
                    }}
                  >
                    {categoryInfo.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {new Date(budget.year, budget.month - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Typography>
                </Box>
              </Box>
              <Box 
                display="flex" 
                alignItems="center" 
                sx={{ 
                  flexShrink: 0,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-end', sm: 'center' },
                  gap: { xs: 0.5, sm: 1 },
                }}
              >
                <Chip
                  label={`${Math.round(progress)}%`}
                  color={budgetStatus.color}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleMenu(e, budget)}
                  sx={{ flexShrink: 0 }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>

            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Spent: {formatCurrency(budget.currentSpent, userProfile.currency)}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Limit: {formatCurrency(budget.monthlyLimit, userProfile.currency)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={budgetStatus.color}
                sx={{ 
                  height: { xs: 6, sm: 8 }, 
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
                {remaining >= 0 ? (
                  <>
                    <TrendingUp color="success" sx={{ mr: 0.5, fontSize: { xs: 18, sm: 20 } }} />
                    <Typography 
                      variant="body2" 
                      color="success.main" 
                      fontWeight={500}
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {formatCurrency(remaining, userProfile.currency)} remaining
                    </Typography>
                  </>
                ) : (
                  <>
                    <TrendingDown color="error" sx={{ mr: 0.5, fontSize: { xs: 18, sm: 20 } }} />
                    <Typography 
                      variant="body2" 
                      color="error.main" 
                      fontWeight={500}
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {formatCurrency(Math.abs(remaining), userProfile.currency)} over budget
                    </Typography>
                  </>
                )}
              </Box>
              {budgetStatus.status === 'warning' && (
                <Warning color="warning" sx={{ fontSize: { xs: 18, sm: 20 }, flexShrink: 0 }} />
              )}
            </Box>

            {budget.isOverBudget && (
              <Alert severity="error" sx={{ mt: 2, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Budget exceeded! Consider reviewing your spending.
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.currentSpent, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', position: 'relative' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Budgets
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* Month Navigation */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={handlePreviousMonth}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 160, textAlign: 'center' }}>
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Overall Summary */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Monthly Overview - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
              <Typography variant="h5" fontWeight={600} color="primary">
                {formatCurrency(totalBudget, userProfile.currency)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
              <Typography variant="h5" fontWeight={600} color={totalSpent > totalBudget ? 'error' : 'success'}>
                {formatCurrency(totalSpent, userProfile.currency)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
              <Typography variant="h5" fontWeight={600} color={totalBudget - totalSpent >= 0 ? 'success' : 'error'}>
                {formatCurrency(totalBudget - totalSpent, userProfile.currency)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Progress
              </Typography>
              <Box display="flex" alignItems="center">
                <LinearProgress
                  variant="determinate"
                  value={Math.min(overallProgress, 100)}
                  color={overallProgress > 100 ? 'error' : overallProgress > 80 ? 'warning' : 'success'}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 1 }}
                />
                <Typography variant="body2" fontWeight={500}>
                  {Math.round(overallProgress)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Add Budget Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                },
                borderRadius: 2,
                px: { xs: 3, sm: 4 },
                py: 1.5,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
              }}
            >
              {isMobile ? 'Add Budget' : 'Add New Budget'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Budget Cards */}
      <Box sx={{ mt: 2 }}>
        <AnimatePresence>
          {budgets.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </Box>
          ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <TrendingUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No budgets set up yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create budgets to track your spending goals and stay on top of your finances
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  Create Your First Budget
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          handleOpenDialog(selectedBudget);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteBudget(selectedBudget?.id)}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create Budget'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {Object.entries(expenseCategories).map(([key, category]) => (
                    <MenuItem key={key} value={key}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Limit"
                type="number"
                value={formData.monthlyLimit}
                onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{getCurrencySymbol(userProfile.currency)}</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Month"
                type="number"
                inputProps={{ min: 1, max: 12 }}
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                inputProps={{ min: 2020, max: 2030 }}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateBudget}
            variant="contained"
            disabled={!formData.category || !formData.monthlyLimit}
          >
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Budgets;
