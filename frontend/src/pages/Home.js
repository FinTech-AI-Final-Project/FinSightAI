import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardActionArea, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';
import AITipsPanel from '../components/AITipsPanel';
import { useState, useEffect, useCallback } from 'react';
import * as ApiService from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useErrorHandler } from '../utils/errorHandler';
import ErrorAlert from '../components/ErrorAlert';
// Use image icons to match mobile navigation

// Features for the grid (no Home, add Settings as last item)
const features = [
  {
    label: 'Dashboard',
    icon: (isMobile) => <img src="/mobile-dashboard.png" alt="Dashboard" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/dashboard',
  },
  {
    label: 'Expenses',
    icon: (isMobile) => <img src="/mobile-expenses.png" alt="Expenses" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/expenses',
  },
  {
    label: 'Budgets',
    icon: (isMobile) => <img src="/mobile-budget.png" alt="Budgets" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/budgets',
  },
  {
    label: 'Can I Afford This?',
    icon: (isMobile) => <img src="/mobile-barcode-scanner.png" alt="Can I Afford This?" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/can-i-afford-this',
  },
  {
    label: 'Reports',
    icon: (isMobile) => <img src="/mobile-reports.png" alt="Reports" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/reports',
  },
  {
    label: 'Settings',
    icon: (isMobile) => <img src="/mobile-settings.png" alt="Settings" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'none' }} />,
    route: '/settings',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tipsExpanded, setTipsExpanded] = useState(false); // always collapsed by default
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, initialized } = useUser();
  const { error, handleError, clearError } = useErrorHandler();

  // Fetch home data (current month's expenses and budgets)
  const fetchHomeData = useCallback(async () => {
    if (!initialized || !userProfile) {
      console.log('Home: Skipping data fetch - user not initialized or profile not available');
      return;
    }

    try {
      setLoading(true);
      clearError();

      const currentMonth = new Date();
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      console.log('Home: Fetching current month data for tips...');

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

      console.log('Home: Data fetched successfully', {
        expenses: expensesResponse?.length || 0,
        budgets: budgetsResponse?.length || 0
      });

      setExpenses(expensesResponse || []);
      setBudgets(budgetsResponse || []);
    } catch (error) {
      console.error('Home: Error fetching home data:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [initialized, userProfile, clearError, handleError]);

  // Load data when component mounts
  useEffect(() => {
    if (initialized && userProfile) {
      fetchHomeData();
    }
  }, [fetchHomeData, initialized, userProfile]);
  return (
    <Box p={2}>
      {/* Top bar for mobile removed as Home button is now in Navbar */}
      {!isMobile && (
        <Typography variant="h5" fontWeight={600} mb={3} align="center">
          Welcome to FinSightAI
        </Typography>
      )}
      {isMobile && (
        <>
          <Typography variant="h4" fontWeight={700} mb={2} align="center" sx={{ color: theme.palette.text.primary }}>
            Welcome!
          </Typography>
          <ErrorAlert error={error} />
          <Box mb={3}>
            <AITipsPanel
              expandable
              expanded={tipsExpanded}
              onExpand={() => setTipsExpanded((prev) => !prev)}
              expenses={expenses}
              budgets={budgets}
            />
          </Box>
        </>
      )}
      <Grid container spacing={2} justifyContent="center">
        {features.map((feature) => (
          <Grid item xs={6} key={feature.label}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: 3 }}>
              <CardActionArea onClick={() => navigate(feature.route)} sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, padding: 8 }}>
                  {feature.icon(isMobile)}
                  <Typography variant="subtitle1" mt={1} align="center" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {feature.label}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;
