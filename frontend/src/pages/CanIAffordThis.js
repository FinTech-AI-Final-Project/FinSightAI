



import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, CircularProgress, Alert, Paper, MenuItem, FormControl, InputLabel, Select, Snackbar } from '@mui/material';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import * as ApiService from '../services/api';
import { expenseCategories, formatCurrency } from '../utils/helpers';
import { useUser } from '../contexts/UserContext';


const CanIAffordThis = () => {
  const { userProfile } = useUser();

  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [manualPrice, setManualPrice] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [availableBudget, setAvailableBudget] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState('');
  const [aiTip, setAiTip] = useState('');
  const [tipLoading, setTipLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');
  // Add as expense handler
  const handleAddExpense = async () => {
    setAdding(true);
    setAddError('');
    try {
      if (!category || !manualPrice || !budgets.find(b => b.category === category)) {
        setAddError('A valid budget for this category is required.');
        setAdding(false);
        return;
      }
      const now = new Date();
      const expenseData = {
        description: product?.product_name || 'Scanned Product',
        amount: manualPrice,
        category,
        date: now.toISOString().split('T')[0],
        notes: product?.brands ? `Brand: ${product.brands}` : '',
      };
      await ApiService.createExpense(expenseData);
      setAddSuccess(true);
      // Optionally, reset form
      setBarcode('');
      setProduct(null);
      setManualPrice('');
      setCategory('');
    } catch (e) {
      setAddError('Failed to add expense.');
    } finally {
      setAdding(false);
    }
  };
  // Fetch contextual AI tip when category, price, or budget status changes
  useEffect(() => {
    // Debounce AI tip fetch by 500ms
    const handler = setTimeout(() => {
      const fetchTip = async () => {
        if (!category || !manualPrice) {
          setAiTip('');
          return;
        }
        setTipLoading(true);
        try {
          // Compose a contextual prompt for the AI, including currency and region, with correct formatting
          let catName = expenseCategories[category]?.name || category;
          let currency = userProfile?.currency || 'ZAR';
          let priceValue = parseFloat(manualPrice);
          let formattedPrice = isNaN(priceValue) ? manualPrice : formatCurrency(priceValue, currency);
          let formattedBudget = (availableBudget != null && !isNaN(availableBudget)) ? formatCurrency(availableBudget, currency) : 'unknown';
          let prompt = `I am considering buying an item in the category '${catName}' for the price of ${formattedPrice}. My available budget for this category is ${formattedBudget}. My region/currency is ${currency}. Should I buy it? Give me a short, actionable tip.`;
          const aiRes = await ApiService.sendChatMessage(prompt);
          setAiTip(aiRes?.reply || '');
        } catch (e) {
          setAiTip('');
        } finally {
          setTipLoading(false);
        }
      };
      fetchTip();
    }, 500);
    return () => clearTimeout(handler);
  }, [category, manualPrice, budgetStatus, availableBudget, userProfile]);
  // Fetch budgets on mount
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const now = new Date();
        const data = await ApiService.getBudgets({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        setBudgets(data || []);
      } catch (e) {
        setBudgets([]);
      }
    };
    fetchBudgets();
  }, []);

  // When category or budgets change, update available budget
  useEffect(() => {
    if (!category || !budgets.length) {
      setAvailableBudget(null);
      setBudgetStatus('');
      return;
    }
    const budget = budgets.find(b => b.category === category);
    if (budget) {
      setAvailableBudget(budget.monthlyLimit - budget.currentSpent);
      if (budget.currentSpent >= budget.monthlyLimit) {
        setBudgetStatus('over');
      } else if (budget.currentSpent >= 0.8 * budget.monthlyLimit) {
        setBudgetStatus('warning');
      } else {
        setBudgetStatus('ok');
      }
    } else {
      setAvailableBudget(null);
      setBudgetStatus('none');
    }
  }, [category, budgets]);

  // Scan barcode using device camera
  const handleScan = async () => {
    setError('');
    setScanning(true);
    try {
      await BarcodeScanner.checkPermission({ force: true });
      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        setBarcode(result.content);
        fetchProductInfo(result.content);
      } else {
        setError('No barcode detected.');
      }
    } catch (e) {
      setError('Barcode scan failed.');
    } finally {
      setScanning(false);
    }
  };

  // Fetch product info from OpenFoodFacts
  const fetchProductInfo = async (barcodeValue) => {
    if (!barcodeValue) return;
    setFetching(true);
    setError('');
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const product = data.product;
        setProduct(product);
        // --- Price extraction ---
        let price = '';
        // Try direct price field
        if (product.price) {
          price = product.price;
        } else if (product.nutriments && product.nutriments['price']) {
          price = product.nutriments['price'];
        } else if (product.nutriments) {
          // Try to find any price_* field
          const priceKey = Object.keys(product.nutriments).find(k => k.startsWith('price_'));
          if (priceKey) price = product.nutriments[priceKey];
        }
        setManualPrice(price || '');

        // --- Category mapping ---
        let foundCategory = '';
        const categoryTags = product.categories_tags || [];
        const categoriesStr = product.categories || '';
        // Lowercase all for easier matching
        const allTags = [
          ...categoryTags.map(tag => tag.toLowerCase()),
          ...categoriesStr.toLowerCase().split(',').map(s => s.trim())
        ];
        // Map OpenFoodFacts categories to internal categories
        const categoryMap = {
          groceries: 'GROCERIES',
          food: 'FOOD_DINING',
          snack: 'GROCERIES',
          snacks: 'GROCERIES',
          beverage: 'FOOD_DINING',
          drinks: 'FOOD_DINING',
          restaurant: 'FOOD_DINING',
          transport: 'TRANSPORTATION',
          shopping: 'SHOPPING',
          entertainment: 'ENTERTAINMENT',
          bill: 'BILLS_UTILITIES',
          utility: 'BILLS_UTILITIES',
          healthcare: 'HEALTHCARE',
          medicine: 'HEALTHCARE',
          education: 'EDUCATION',
          travel: 'TRAVEL',
          personal: 'PERSONAL_CARE',
          business: 'BUSINESS',
          gift: 'GIFTS_DONATIONS',
          donation: 'GIFTS_DONATIONS',
          investment: 'INVESTMENTS',
          crypto: 'CRYPTO',
        };
        // Try to find a match
        for (const tag of allTags) {
          for (const [key, val] of Object.entries(categoryMap)) {
            if (tag.includes(key)) {
              foundCategory = val;
              break;
            }
          }
          if (foundCategory) break;
        }
        // Fallback: if nothing found, leave as is
        if (foundCategory) setCategory(foundCategory);
      } else {
        setProduct(null);
        setManualPrice('');
        setError('Product not found. Enter price manually.');
      }
    } catch (e) {
      setError('Failed to fetch product info.');
      setProduct(null);
      setManualPrice('');
    } finally {
      setFetching(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2} fontWeight={600}>Can I afford this?</Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleScan} disabled={scanning} sx={{ mb: 2, width: '100%' }}>
          {scanning ? <CircularProgress size={20} /> : 'Scan Barcode'}
        </Button>
        <Typography variant="body2" mb={1}>or enter barcode manually:</Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            label="Barcode"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            fullWidth
            disabled={scanning}
          />
          <Button variant="outlined" onClick={() => fetchProductInfo(barcode)} disabled={fetching || !barcode}>
            {fetching ? <CircularProgress size={20} /> : 'Fetch'}
          </Button>
        </Box>
        {(product || barcode) && (
          <Box mt={2}>
            {product && (
              <Typography variant="subtitle1" fontWeight={500} mb={1}>
                Product: {product.product_name || 'Unknown'}
              </Typography>
            )}
            <TextField
              label="Price"
              value={manualPrice}
              onChange={e => setManualPrice(e.target.value)}
              type="number"
              sx={{ mb: 2 }}
              fullWidth
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={e => setCategory(e.target.value)}
              >
                {Object.entries(expenseCategories).map(([key, cat]) => (
                  <MenuItem key={key} value={key}>
                    {cat.icon} {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {category && (
              <Box mb={2}>
                {budgetStatus === 'none' && (
                  <Alert severity="warning">No budget set for this category.</Alert>
                )}
                {budgetStatus === 'over' && (
                  <Alert severity="error">You are over budget for this category!</Alert>
                )}
                {budgetStatus === 'warning' && (
                  <Alert severity="warning">You are close to your budget limit for this category.</Alert>
                )}
                {budgetStatus === 'ok' && (
                  <Alert severity="success">You have {availableBudget != null ? availableBudget.toFixed(2) : '--'} left in this category.</Alert>
                )}
                {availableBudget != null && manualPrice && (
                  Number(manualPrice) > availableBudget ? (
                    <Alert severity="error">This item exceeds your available budget!</Alert>
                  ) : (
                    <Alert severity="info">This item is within your available budget.</Alert>
                  )
                )}
                {/* AI Tip */}
                {tipLoading ? (
                  <Box mt={2}><CircularProgress size={18} /></Box>
                ) : aiTip ? (
                  <Alert severity="info" sx={{ mt: 2 }}>{aiTip}</Alert>
                ) : null}
              </Box>
            )}
            {/* Add as Expense Button */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
              disabled={
                !category || !manualPrice || Number(manualPrice) <= 0 || budgetStatus === 'none' || adding
              }
              onClick={handleAddExpense}
            >
              {adding ? <CircularProgress size={20} /> : 'Add as Expense'}
            </Button>
            {addError && <Alert severity="error" sx={{ mt: 2 }}>{addError}</Alert>}
            <Snackbar
              open={addSuccess}
              autoHideDuration={3000}
              onClose={() => setAddSuccess(false)}
              message="Expense added successfully!"
            />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Box>
  );
};

export default CanIAffordThis;
