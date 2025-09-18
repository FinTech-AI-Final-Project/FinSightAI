import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Lightbulb,
  ExpandMore,
  TrendingUp,
  AccountBalance,
  ShoppingCart,
  Warning,
  CheckCircle,
  Refresh,
  Psychology,
  AutoAwesome,
  CurrencyBitcoin,
  Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import * as ApiService from '../services/api';
import * as CryptoService from '../services/cryptoService';
import CashFlowForecastingService from '../services/cashFlowService';
import { useUser } from '../contexts/UserContext';
import { formatCurrency } from '../utils/helpers';

const AITipsPanel = ({ expenses: propExpenses = [], budgets: propBudgets = [] }) => {
  const [tips, setTips] = useState([]);
  const [cryptoTips, setCryptoTips] = useState([]);
  const [cashFlowTips, setCashFlowTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cashFlowLoading, setCashFlowLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentCryptoTipIndex, setCurrentCryptoTipIndex] = useState(0);
  const [currentCashFlowTipIndex, setCurrentCashFlowTipIndex] = useState(0);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);
  const [expenses, setExpenses] = useState(propExpenses);
  const [budgets, setBudgets] = useState(propBudgets);
  const [dataLoading, setDataLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userProfile } = useUser();

  // Auto-rotate tips every 8 seconds when collapsed
  useEffect(() => {
    if (!expanded && tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [expanded, tips.length]);

  // Auto-rotate crypto tips every 10 seconds when collapsed
  useEffect(() => {
    if (!expanded && cryptoTips.length > 1) {
      const interval = setInterval(() => {
        setCurrentCryptoTipIndex((prevIndex) => (prevIndex + 1) % cryptoTips.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [expanded, cryptoTips.length]);

  // Auto-rotate cash flow tips every 12 seconds when collapsed
  useEffect(() => {
    if (!expanded && cashFlowTips.length > 1) {
      const interval = setInterval(() => {
        setCurrentCashFlowTipIndex((prevIndex) => (prevIndex + 1) % cashFlowTips.length);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [expanded, cashFlowTips.length]);

  // Fetch expenses and budgets data if not provided as props
  const fetchExpensesAndBudgets = useCallback(async () => {
    // If we already have data from props, don't fetch
    if (propExpenses.length > 0 || propBudgets.length > 0) {
      setExpenses(propExpenses);
      setBudgets(propBudgets);
      return;
    }

    // If no props provided, fetch current month's data
    if (!userProfile) return;

    try {
      setDataLoading(true);
      console.log('📊 Fetching expenses and budgets data for tips...');

      const currentMonth = new Date();
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Fetch current month's expenses
      const expensesResponse = await ApiService.getExpenses({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      // Fetch current month's budgets
      const budgetsResponse = await ApiService.getBudgets({
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
      });

      console.log('✅ Tips data fetched:', {
        expenses: expensesResponse?.length || 0,
        budgets: budgetsResponse?.length || 0
      });

      setExpenses(expensesResponse || []);
      setBudgets(budgetsResponse || []);
    } catch (error) {
      console.warn('⚠️ Failed to fetch tips data:', error.message);
      setExpenses([]);
      setBudgets([]);
    } finally {
      setDataLoading(false);
    }
  }, [propExpenses, propBudgets, userProfile]);

  // Generate smart fallback tips based on user data
  const generateSmartFallbackTips = useCallback(() => {
    const fallbackTips = [];
    const userName = userProfile?.firstName || 'there';
    
    if (expenses.length > 0) {
      const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const avgExpense = totalSpent / expenses.length;
      
      fallbackTips.push(
        `💰 Hey ${userName}! You've spent ${formatCurrency(totalSpent, userProfile.currency)} this month across ${expenses.length} transactions. Your average expense is ${formatCurrency(avgExpense, userProfile.currency)}.`
      );
      
      // Analyze spending patterns
      const categories = {};
      expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount);
      });
      
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        fallbackTips.push(
          `📊 ${userName}, your largest spending category is ${topCategory[0]} at ${formatCurrency(topCategory[1], userProfile.currency)}. Consider setting a budget for this category!`
        );
      }
    }
    
    if (budgets.length === 0) {
      fallbackTips.push(
        `🎯 Hi ${userName}! Setting up budgets is a great way to track your spending. Start with your most frequent expense categories.`
      );
    } else {
      // Analyze budget performance
      const budgetPerformance = budgets.map(budget => {
        const spent = expenses
          .filter(exp => exp.category === budget.category)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        return { ...budget, spent, percentage: (spent / budget.amount) * 100 };
      });
      
      const overBudget = budgetPerformance.filter(b => b.percentage > 100);
      const underBudget = budgetPerformance.filter(b => b.percentage < 80);
      
      if (overBudget.length > 0) {
        const worstBudget = overBudget.sort((a, b) => b.percentage - a.percentage)[0];
        fallbackTips.push(
          `🚨 ${userName}, you're ${worstBudget.percentage.toFixed(0)}% over budget for ${worstBudget.category}! Time to review those expenses.`
        );
      }
      
      if (underBudget.length > 0) {
        const bestBudget = underBudget.sort((a, b) => a.percentage - b.percentage)[0];
        fallbackTips.push(
          `✅ Great job ${userName}! You're only using ${bestBudget.percentage.toFixed(0)}% of your ${bestBudget.category} budget. Keep it up!`
        );
      }
    }
    
    // Add some general tips if we don't have enough
    if (fallbackTips.length < 3) {
      fallbackTips.push(
        `💡 ${userName}, try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.`,
        `🔍 ${userName}, review your subscriptions monthly. Small recurring charges can add up to significant amounts over time.`,
        `📱 ${userName}, use your FinSight AI app to track expenses in real-time for better financial awareness.`
      );
    }
    
    return fallbackTips.slice(0, 3);
  }, [expenses, budgets, userProfile?.firstName, userProfile?.currency]);

  // Fetch AI-enhanced tips with no rate limiting
  const fetchAITips = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setIsAiEnhanced(false);
    
    try {
      console.log('🤖 Fetching AI-enhanced tips...');
      
      // Try to get multiple AI-enhanced tips
      const response = await ApiService.getMultipleTips();
      
      if (response && response.tips && response.tips.length > 0) {
        console.log('✅ AI tips received:', response.tips.length);
        setTips(response.tips);
        setIsAiEnhanced(true);
      } else {
        // Try single tip as fallback
        const singleTipResponse = await ApiService.getDailyTip(userProfile.currency);
        if (singleTipResponse && singleTipResponse.tip) {
          console.log('✅ Single AI tip received');
          setTips([singleTipResponse.tip]);
          setIsAiEnhanced(true);
        } else {
          throw new Error('No AI tips received');
        }
      }
    } catch (error) {
      console.warn('⚠️ AI tips failed, using smart fallbacks:', error.message);
      setTips(generateSmartFallbackTips());
      setIsAiEnhanced(false);
    } finally {
      setLoading(false);
      setCurrentTipIndex(0);
    }
  }, [loading, userProfile?.currency, generateSmartFallbackTips]);

  // Fetch crypto tips using Blockchair API
  const fetchCryptoTips = useCallback(async () => {
    if (cryptoLoading) return;
    
    setCryptoLoading(true);
    
    try {
      console.log('💰 Fetching crypto tips...');
      const cryptoTipsData = await CryptoService.getMultipleCryptoTips(userProfile?.currency || 'USD');
      
      if (cryptoTipsData && cryptoTipsData.length > 0) {
        console.log('✅ Crypto tips received:', cryptoTipsData.length);
        setCryptoTips(cryptoTipsData);
      } else {
        throw new Error('No crypto tips received');
      }
    } catch (error) {
      console.warn('⚠️ Crypto tips failed, using fallback:', error.message);
      // Fallback crypto tips
      setCryptoTips([
        '💡 Crypto investing tip: Start with established cryptocurrencies like Bitcoin and Ethereum before exploring altcoins.',
        '🔐 Security first: Use reputable exchanges, enable two-factor authentication, and consider cold storage for large holdings.',
        '⚠️ Never invest more than you can afford to lose in cryptocurrency. The market is highly volatile and speculative.'
      ]);
    } finally {
      setCryptoLoading(false);
      setCurrentCryptoTipIndex(0);
    }
  }, [cryptoLoading, userProfile?.currency]);

  // Fetch cash flow forecasting tips
  const fetchCashFlowTips = useCallback(async () => {
    if (cashFlowLoading) return;

    setCashFlowLoading(true);

    try {
      console.log('📊 Generating cash flow forecasting tips...');
      const cashFlowTipsData = CashFlowForecastingService.getMultipleCashFlowTips(
        expenses,
        budgets,
        userProfile?.currency || 'USD'
      );

      if (cashFlowTipsData && cashFlowTipsData.length > 0) {
        console.log('✅ Cash flow tips generated:', cashFlowTipsData.length);
        setCashFlowTips(cashFlowTipsData);
      } else {
        throw new Error('No cash flow tips generated');
      }
    } catch (error) {
      console.warn('⚠️ Cash flow tips failed, using fallback:', error.message);
      // Fallback cash flow tips
      setCashFlowTips([
        '📊 Build an emergency fund with 3-6 months of expenses for better cash flow security.',
        '💰 Track your spending patterns to identify areas for cash flow optimization.',
        '🎯 Use the 50/30/20 rule to balance your cash flow: 50% needs, 30% wants, 20% savings.'
      ]);
    } finally {
      setCashFlowLoading(false);
      setCurrentCashFlowTipIndex(0);
    }
  }, [cashFlowLoading, expenses, budgets, userProfile?.currency]);

  // Fetch data when component mounts or when props change
  useEffect(() => {
    if (userProfile) {
      fetchExpensesAndBudgets();
    }
  }, [fetchExpensesAndBudgets, userProfile]);

  // Load tips when data is available
  useEffect(() => {
    if (userProfile && !dataLoading) {
      fetchAITips();
      fetchCryptoTips();
      fetchCashFlowTips();
    }
  }, [userProfile, dataLoading]); // Depend on userProfile and dataLoading

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([fetchAITips(), fetchCryptoTips(), fetchCashFlowTips()]);
  }, [fetchAITips, fetchCryptoTips, fetchCashFlowTips]);

  const getTipIcon = (tip) => {
    if (tip.includes('🚨') || tip.includes('Budget Alert') || tip.includes('over budget')) {
      return <Warning color="warning" />;
    } else if (tip.includes('✅') || tip.includes('Great job') || tip.includes('within your limits')) {
      return <CheckCircle color="success" />;
    } else if (tip.includes('investment') || tip.includes('ETF') || tip.includes('savings')) {
      return <TrendingUp color="primary" />;
    } else if (tip.includes('budget') || tip.includes('spending')) {
      return <AccountBalance color="info" />;
    } else if (tip.includes('shopping') || tip.includes('purchase')) {
      return <ShoppingCart color="secondary" />;
    } else if (tip.includes('Bitcoin') || tip.includes('crypto') || tip.includes('Ethereum') || tip.includes('DeFi') || tip.includes('blockchain')) {
      return <CurrencyBitcoin color="warning" />;
    } else if (tip.includes('cash flow') || tip.includes('forecast') || tip.includes('📊') || tip.includes('📈') || tip.includes('📉') || tip.includes('emergency fund')) {
      return <Timeline color="info" />;
    }
    return isAiEnhanced ? <Psychology color="primary" /> : <Lightbulb color="primary" />;
  };

  const getTipSeverity = (tip) => {
    if (tip.includes('🚨') || tip.includes('Budget Alert') || tip.includes('over budget')) {
      return 'warning';
    } else if (tip.includes('✅') || tip.includes('Great job')) {
      return 'success';
    }
    return 'info';
  };

  const getTipCategory = (tip) => {
    if (tip.includes('budget') || tip.includes('Budget Alert')) return 'Budget';
    if (tip.includes('investment') || tip.includes('ETF') || tip.includes('savings')) return 'Investment';
    if (tip.includes('shopping') || tip.includes('purchase') || tip.includes('meal') || tip.includes('food')) return 'Spending';
    if (tip.includes('Bitcoin') || tip.includes('crypto') || tip.includes('Ethereum') || tip.includes('DeFi') || tip.includes('blockchain')) return 'Crypto';
    if (tip.includes('cash flow') || tip.includes('forecast') || tip.includes('📊') || tip.includes('📈') || tip.includes('📉') || tip.includes('emergency fund')) return 'Cash Flow';
    if (tip.includes('tip') || tip.includes('advice')) return 'General';
    return 'Insight';
  };

  const currentTip = tips[currentTipIndex] || '';
  const currentCryptoTip = cryptoTips[currentCryptoTipIndex] || '';
  const currentCashFlowTip = cashFlowTips[currentCashFlowTipIndex] || '';
  const isLoading = loading || cryptoLoading || cashFlowLoading;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 0,
        mt: 4, // Increased top margin to ensure proper spacing from navbar
        mb: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative', // Ensure it's in normal document flow
        zIndex: 1, // Lower z-index than navbar
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAiEnhanced ? (
              <AutoAwesome sx={{ color: theme.palette.primary.main }} />
            ) : (
              <Lightbulb sx={{ color: theme.palette.primary.main }} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Smart Tips
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              size="small"
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': { backgroundColor: theme.palette.action.hover }
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
              ) : (
                <Refresh />
              )}
            </IconButton>
            
            {!isMobile && (
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{ 
                  color: theme.palette.text.primary,
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                <ExpandMore />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Current Tip Display */}
        {!expanded && currentTip && (
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              severity={getTipSeverity(currentTip)}
              icon={getTipIcon(currentTip)}
              sx={{
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                '& .MuiAlert-icon': { alignItems: 'center', color: theme.palette.text.primary },
                '& .MuiAlert-message': { color: theme.palette.text.primary }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                  {currentTip}
                </Typography>
                <Chip
                  label={getTipCategory(currentTip)}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    ml: 1, 
                    fontSize: '0.65rem', 
                    height: 20,
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.divider
                  }}
                />
              </Box>
            </Alert>
          </motion.div>
        )}

        {/* AI Tips Counter */}
        {!expanded && tips.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {tips.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index === currentTipIndex 
                      ? theme.palette.primary.main 
                      : theme.palette.mode === 'dark' 
                        ? theme.palette.action.disabled
                        : theme.palette.grey[400],
                    transition: 'background-color 0.3s',
                    cursor: 'pointer',
                    border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.grey[600]}` : 'none',
                  }}
                  onClick={() => setCurrentTipIndex(index)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Crypto Tips Section */}
        {!expanded && currentCryptoTip && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CurrencyBitcoin sx={{ fontSize: 18, color: theme.palette.warning.main }} />
              Crypto Investment Tips
            </Typography>
            <motion.div
              key={`crypto-${currentCryptoTipIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Alert
                severity="info"
                icon={<CurrencyBitcoin />}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.warning.main}40`,
                  color: theme.palette.text.primary,
                  '& .MuiAlert-icon': { alignItems: 'center', color: theme.palette.warning.main },
                  '& .MuiAlert-message': { color: theme.palette.text.primary }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                    {currentCryptoTip}
                  </Typography>
                  <Chip
                    label="Crypto"
                    size="small"
                    variant="outlined"
                    sx={{ 
                      ml: 1, 
                      fontSize: '0.65rem', 
                      height: 20,
                      color: theme.palette.warning.main,
                      borderColor: `${theme.palette.warning.main}80`
                    }}
                  />
                </Box>
              </Alert>
            </motion.div>
          </Box>
        )}

        {/* Crypto Tips Counter */}
        {!expanded && cryptoTips.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {cryptoTips.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index === currentCryptoTipIndex 
                      ? '#FFB74D' 
                      : theme.palette.mode === 'dark' 
                        ? theme.palette.action.disabled
                        : theme.palette.grey[400],
                    transition: 'background-color 0.3s',
                    cursor: 'pointer',
                    border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.grey[600]}` : 'none',
                  }}
                  onClick={() => setCurrentCryptoTipIndex(index)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Cash Flow Tips Section */}
        {!expanded && currentCashFlowTip && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline sx={{ fontSize: 18, color: theme.palette.info.main }} />
              Cash Flow Forecasting
            </Typography>
            <motion.div
              key={`cashflow-${currentCashFlowTipIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Alert
                severity="info"
                icon={<Timeline />}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.info.main}40`,
                  color: theme.palette.text.primary,
                  '& .MuiAlert-icon': { alignItems: 'center', color: theme.palette.info.main },
                  '& .MuiAlert-message': { color: theme.palette.text.primary }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                    {currentCashFlowTip}
                  </Typography>
                  <Chip
                    label="Cash Flow"
                    size="small"
                    variant="outlined"
                    sx={{ 
                      ml: 1, 
                      fontSize: '0.65rem', 
                      height: 20,
                      color: theme.palette.info.main,
                      borderColor: `${theme.palette.info.main}80`
                    }}
                  />
                </Box>
              </Alert>
            </motion.div>
          </Box>
        )}

        {/* Cash Flow Tips Counter */}
        {!expanded && cashFlowTips.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {cashFlowTips.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: index === currentCashFlowTipIndex 
                      ? '#4FC3F7' 
                      : theme.palette.mode === 'dark' 
                        ? theme.palette.action.disabled
                        : theme.palette.grey[400],
                    transition: 'background-color 0.3s',
                    cursor: 'pointer',
                    border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.grey[600]}` : 'none',
                  }}
                  onClick={() => setCurrentCashFlowTipIndex(index)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Expanded View - Hidden on mobile */}
        <Collapse in={expanded && !isMobile}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />
            
            {/* AI Tips Section */}
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAiEnhanced ? <AutoAwesome sx={{ color: theme.palette.primary.main }} /> : <Lightbulb sx={{ color: theme.palette.primary.main }} />}
              AI Financial Tips ({tips.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <AnimatePresence>
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Alert
                      severity={getTipSeverity(tip)}
                      icon={getTipIcon(tip)}
                      sx={{
                        backgroundColor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`,
                        color: theme.palette.text.primary,
                        '& .MuiAlert-icon': { color: theme.palette.text.primary },
                        '& .MuiAlert-message': { color: theme.palette.text.primary }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                          {tip}
                        </Typography>
                        <Chip
                          label={getTipCategory(tip)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            ml: 1, 
                            fontSize: '0.65rem', 
                            height: 20,
                            color: theme.palette.text.primary,
                            borderColor: theme.palette.divider
                          }}
                        />
                      </Box>
                    </Alert>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>

            {/* Crypto Tips Section */}
            {cryptoTips.length > 0 && (
              <>
                <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyBitcoin sx={{ color: theme.palette.warning.main }} />
                  Crypto Investment Tips ({cryptoTips.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <AnimatePresence>
                    {cryptoTips.map((tip, index) => (
                      <motion.div
                        key={`crypto-expanded-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Alert
                          severity="info"
                          icon={<CurrencyBitcoin />}
                          sx={{
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.warning.main}40`,
                            color: theme.palette.text.primary,
                            '& .MuiAlert-icon': { color: theme.palette.warning.main },
                            '& .MuiAlert-message': { color: theme.palette.text.primary }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                              {tip}
                            </Typography>
                            <Chip
                              label="Crypto"
                              size="small"
                              variant="outlined"
                              sx={{ 
                                ml: 1, 
                                fontSize: '0.65rem', 
                                height: 20,
                                color: theme.palette.warning.main,
                                borderColor: `${theme.palette.warning.main}80`
                              }}
                            />
                          </Box>
                        </Alert>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </>
            )}

            {/* Cash Flow Tips Section */}
            {cashFlowTips.length > 0 && (
              <>
                <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline sx={{ color: theme.palette.info.main }} />
                  Cash Flow Forecasting ({cashFlowTips.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <AnimatePresence>
                    {cashFlowTips.map((tip, index) => (
                      <motion.div
                        key={`cashflow-expanded-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Alert
                          severity="info"
                          icon={<Timeline />}
                          sx={{
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.info.main}40`,
                            color: theme.palette.text.primary,
                            '& .MuiAlert-icon': { color: theme.palette.info.main },
                            '& .MuiAlert-message': { color: theme.palette.text.primary }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: theme.palette.text.primary }}>
                              {tip}
                            </Typography>
                            <Chip
                              label="Cash Flow"
                              size="small"
                              variant="outlined"
                              sx={{ 
                                ml: 1, 
                                fontSize: '0.65rem', 
                                height: 20,
                                color: theme.palette.info.main,
                                borderColor: `${theme.palette.info.main}80`
                              }}
                            />
                          </Box>
                        </Alert>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </>
            )}
          </Box>
        </Collapse>

        {/* Status Footer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 2, 
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}20`
        }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {isLoading ? 'Loading insights...' : ''}
          </Typography>
          
          {!expanded && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Total Tips: {tips.length + cryptoTips.length + cashFlowTips.length}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Paper>
  );
};

export default AITipsPanel;


