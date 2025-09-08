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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import * as ApiService from '../services/api';
import { useUser } from '../contexts/UserContext';

const AITipsPanel = ({ expenses = [], budgets = [] }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);
  const theme = useTheme();
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

  // Generate smart fallback tips based on user data
  const generateSmartFallbackTips = useCallback(() => {
    const fallbackTips = [];
    const userName = userProfile?.firstName || 'there';
    
    if (expenses.length > 0) {
      const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const avgExpense = totalSpent / expenses.length;
      
      fallbackTips.push(
        `💰 Hey ${userName}! You've spent ${userProfile.currency} ${totalSpent.toFixed(2)} this month across ${expenses.length} transactions. Your average expense is ${userProfile.currency} ${avgExpense.toFixed(2)}.`
      );
      
      // Analyze spending patterns
      const categories = {};
      expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount);
      });
      
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        fallbackTips.push(
          `📊 ${userName}, your largest spending category is ${topCategory[0]} at ${userProfile.currency} ${topCategory[1].toFixed(2)}. Consider setting a budget for this category!`
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

  // Load tips on component mount
  useEffect(() => {
    fetchAITips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchAITips();
  }, [fetchAITips]);

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
    if (tip.includes('tip') || tip.includes('advice')) return 'General';
    return 'Insight';
  };

  const currentTip = tips[currentTipIndex] || '';

  return (
    <Paper
      elevation={1}
      sx={{
        p: 0,
        mt: 4, // Increased top margin to ensure proper spacing from navbar
        mb: 3,
        backgroundColor: '#000000',
        border: '1px solid rgba(255, 255, 255, 0.12)',
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
              <AutoAwesome sx={{ color: '#ffffff' }} />
            ) : (
              <Lightbulb sx={{ color: '#ffffff' }} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
              Smart Tips
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              size="small"
              sx={{ 
                color: '#ffffff',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: '#ffffff' }} />
              ) : (
                <Refresh />
              )}
            </IconButton>
            
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              sx={{ 
                color: '#ffffff',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <ExpandMore />
            </IconButton>
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
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                '& .MuiAlert-icon': { alignItems: 'center', color: '#ffffff' },
                '& .MuiAlert-message': { color: '#ffffff' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: '#ffffff' }}>
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
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              </Box>
            </Alert>
          </motion.div>
        )}

        {/* Tip Counter */}
        {!expanded && tips.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 0.5 }}>
            {tips.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentTipIndex 
                    ? theme.palette.primary.main 
                    : theme.palette.action.disabled,
                  transition: 'background-color 0.3s',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentTipIndex(index)}
              />
            ))}
          </Box>
        )}

        {/* Expanded View */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#ffffff' }}>
              All Tips ({tips.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        '& .MuiAlert-icon': { color: '#ffffff' },
                        '& .MuiAlert-message': { color: '#ffffff' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, color: '#ffffff' }}>
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
                            color: '#ffffff',
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          }}
                        />
                      </Box>
                    </Alert>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
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
            {loading ? 'Loading insights...' : ''}
          </Typography>
          
          {!expanded && tips.length > 1 && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {currentTipIndex + 1} of {tips.length}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Paper>
  );
};

export default AITipsPanel;
