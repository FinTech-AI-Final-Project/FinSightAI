import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Receipt,
  Search,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';

import * as ApiService from '../services/api';
import { formatCurrency, formatDate, expenseCategories, getCurrencySymbol } from '../utils/helpers';
import { useUser } from '../contexts/UserContext';
import receiptScanner from '../services/receiptScanner';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [error, setError] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useUser();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date(),
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [userProfile.currency]); // Re-fetch when currency changes

  useEffect(() => {
    // Listen for currency changes from other components
    const handleCurrencyChange = () => {
      fetchExpenses();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getExpenses();
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    try {
      const expenseData = {
        ...formData,
        amount: formData.amount.toString(), // Send as string for BigDecimal conversion
        date: formData.date.toISOString().split('T')[0],
      };

      if (editingExpense) {
        await ApiService.updateExpense(editingExpense.id, expenseData);
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('expenseUpdated'));
      } else {
        await ApiService.createExpense(expenseData);
        // Dispatch create event
        window.dispatchEvent(new CustomEvent('expenseAdded'));
      }

      await fetchExpenses();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await ApiService.deleteExpense(expenseId);
      await fetchExpenses();
      handleCloseMenu();
      // Dispatch delete event
      window.dispatchEvent(new CustomEvent('expenseDeleted'));
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
    }
  };

  const handleOpenDialog = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: new Date(expense.date),
        notes: expense.notes || '',
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date(),
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
  };

  const handleMenu = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleScanReceipt = () => {
    // Create file input for camera access
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          console.log('📸 Starting receipt scan for file:', file.name);
          setIsScanning(true);
          setOcrProgress(0);
          setError('');
          
          // Simple progress callback that won't cause worker issues
          const onProgress = (progressData) => {
            const progress = Math.round((progressData.progress || 0) * 100);
            console.log('📸 OCR Progress:', progress + '%');
            setOcrProgress(progress);
          };
          
          // Scan the receipt using OCR
          console.log('📸 Calling receiptScanner.scanReceipt...');
          const result = await receiptScanner.scanReceipt(file, onProgress);
          console.log('📸 OCR result:', result);
          
          if (result.success) {
            const { parsedData } = result;
            console.log('📸 Parsed data:', parsedData);
            
            // Update form with extracted data
            setFormData(prev => ({
              ...prev,
              description: parsedData.description || prev.description,
              amount: parsedData.amount ? parsedData.amount.toString() : prev.amount,
              category: parsedData.category || prev.category,
              date: parsedData.date ? new Date(parsedData.date) : prev.date,
              notes: `Receipt scan${parsedData.merchant ? ` from ${parsedData.merchant}` : ''}${result.rawText ? `\n\nOCR Text:\n${result.rawText.substring(0, 300)}${result.rawText.length > 300 ? '...' : ''}` : ''}`
            }));
            
            // Open the dialog so user can review and edit
            setOpenDialog(true);
            
            // Show confidence information if available
            if (parsedData.confidence) {
              const confidenceMsg = Object.entries(parsedData.confidence)
                .filter(([_, confidence]) => confidence > 0)
                .map(([field, confidence]) => `${field}: ${Math.round(confidence * 100)}%`)
                .join(', ');
              
              if (confidenceMsg) {
                setError(`✅ Receipt scanned successfully! Confidence levels: ${confidenceMsg}. Please review and edit the details before saving.`);
              } else {
                setError(`✅ Receipt scanned successfully! Please review and edit the details before saving.`);
              }
            } else {
              setError(`✅ Receipt scanned successfully! Please review and edit the details before saving.`);
            }
          } else {
            console.error('📸 OCR failed:', result.error);
            setError(`❌ ${result.error || 'Failed to process receipt. Please enter details manually.'}`);
            // Still open dialog for manual entry
            setOpenDialog(true);
          }
          
        } catch (error) {
          console.error('📸 Error processing receipt:', error);
          setError(`❌ Error processing receipt: ${error.message}. Please enter details manually.`);
          setOpenDialog(true);
        } finally {
          setIsScanning(false);
          setOcrProgress(0);
        }
      }
    };
    
    input.click();
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const ExpenseCard = ({ expense }) => {
    const categoryInfo = expenseCategories[expense.category] || { name: expense.category, icon: '📝', color: '#666' };

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
          className="expense-card"
          sx={{ 
            mb: 2,
            mx: { xs: 0, sm: 'auto' }, // No horizontal margin on mobile
            cursor: isMobile ? 'default' : 'pointer',
            '&:hover': {
              boxShadow: isMobile ? undefined : '0 8px 16px rgba(0,0,0,0.15)',
            }
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%' }}>
              <Box display="flex" alignItems="center" sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: '50%',
                    backgroundColor: categoryInfo.color + '20',
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {expense.description}
                  </Typography>
                  <Box display="flex" gap={1} mb={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip 
                      label={categoryInfo.name}
                      size="small"
                      sx={{ 
                        backgroundColor: categoryInfo.color + '20',
                        color: categoryInfo.color,
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      }}
                    />
                    <Chip 
                      label={formatDate(expense.date)}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      }}
                    />
                  </Box>
                  {expense.notes && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {expense.notes}
                    </Typography>
                  )}
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
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"}
                  fontWeight={600}
                  color="primary"
                  sx={{ 
                    textAlign: 'right',
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {formatCurrency(expense.amount, userProfile.currency)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenu(e, expense)}
                  sx={{ 
                    ml: { xs: 0, sm: 0.5 },
                    p: { xs: 0.5, sm: 1 },
                  }}
                >
                  <MoreVert sx={{ fontSize: { xs: '18px', sm: '24px' } }} />
                </IconButton>
              </Box>
            </Box>
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

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto', 
      position: 'relative',
      px: { xs: 1, sm: 2 }, // Mobile-responsive padding
      pb: { xs: 10, sm: 2 }, // Extra bottom padding for mobile navigation
    }}>
        {/* Header Section with Title */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center',
            mb: 3,
            px: { xs: 1, sm: 0 },
            position: 'static',
            backgroundColor: 'transparent',
            pt: { xs: 0, sm: 0 },
            mt: { xs: 0, sm: 0 },
          }}
        >
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ fontWeight: 600 }}
          >
            Expenses
          </Typography>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Filter by Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.entries(expenseCategories).map(([key, category]) => (
                    <MenuItem key={key} value={key}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  },
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 600,
                  height: '40px', // Match the height of other form elements
                }}
              >
                {isMobile ? 'Add Expense' : 'Add New Expense'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <AnimatePresence>
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expenses found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || filterCategory 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by adding your first expense'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
          handleOpenDialog(selectedExpense);
          handleCloseMenu();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteExpense(selectedExpense?.id)}>
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
          {editingExpense ? 'Edit Expense' : 'Add Expense'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="end">
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <Button
                  variant="outlined"
                  startIcon={isScanning ? <CircularProgress size={20} /> : <Receipt />}
                  onClick={() => handleScanReceipt()}
                  disabled={isScanning}
                  sx={{ minWidth: 120, height: 56 }}
                >
                  {isScanning ? `Scanning... ${ocrProgress}%` : 'Scan Receipt'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{getCurrencySymbol(userProfile.currency)}</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateExpense}
            variant="contained"
            disabled={!formData.description || !formData.amount || !formData.category}
          >
            {editingExpense ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
