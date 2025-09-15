import { formatCurrency } from '../utils/helpers';

// Cash flow forecasting service that analyzes spending patterns and predicts future financial trends
class CashFlowForecastingService {
  
  // Analyze spending patterns from expenses data
  static analyzeSpendingPatterns(expenses = [], budgets = []) {
    if (!expenses || expenses.length === 0) {
      return {
        avgDailySpending: 0,
        avgMonthlySpending: 0,
        spendingTrend: 'stable',
        topCategories: [],
        seasonalPatterns: [],
        totalBudget: 0,
        budgetUtilization: 0
      };
    }

    // Calculate basic spending metrics
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const avgDailySpending = totalSpent / Math.max(1, this.getDaysInPeriod(expenses));
    const avgMonthlySpending = (totalSpent / Math.max(1, this.getMonthsInPeriod(expenses))) || totalSpent;

    // Analyze spending trend
    const spendingTrend = this.calculateSpendingTrend(expenses);

    // Get top spending categories
    const topCategories = this.getTopSpendingCategories(expenses);

    // Analyze seasonal patterns (if enough historical data)
    const seasonalPatterns = this.analyzeSeasonalPatterns(expenses);

    // Calculate budget metrics
    const totalBudget = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount || budget.monthlyLimit || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      avgDailySpending,
      avgMonthlySpending,
      spendingTrend,
      topCategories,
      seasonalPatterns,
      totalBudget,
      budgetUtilization,
      totalSpent
    };
  }

  // Calculate spending trend (increasing, decreasing, stable)
  static calculateSpendingTrend(expenses) {
    if (expenses.length < 4) return 'stable';

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Split into two halves and compare
    const midPoint = Math.floor(sortedExpenses.length / 2);
    const firstHalf = sortedExpenses.slice(0, midPoint);
    const secondHalf = sortedExpenses.slice(midPoint);

    const firstHalfTotal = firstHalf.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const secondHalfTotal = secondHalf.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const avgFirst = firstHalfTotal / firstHalf.length;
    const avgSecond = secondHalfTotal / secondHalf.length;

    const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (changePercent > 15) return 'increasing';
    if (changePercent < -15) return 'decreasing';
    return 'stable';
  }

  // Get top spending categories
  static getTopSpendingCategories(expenses) {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
    });

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
  }

  // Analyze seasonal spending patterns
  static analyzeSeasonalPatterns(expenses) {
    if (expenses.length < 12) return [];

    const monthlySpending = {};
    
    expenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      monthlySpending[month] = (monthlySpending[month] || 0) + parseFloat(expense.amount);
    });

    const avgSpending = Object.values(monthlySpending).reduce((sum, amount) => sum + amount, 0) / Object.keys(monthlySpending).length;
    
    return Object.entries(monthlySpending)
      .filter(([_, amount]) => amount > avgSpending * 1.2)
      .map(([month, amount]) => ({
        month: this.getMonthName(parseInt(month)),
        amount,
        percentAboveAvg: ((amount - avgSpending) / avgSpending) * 100
      }));
  }

  // Generate cash flow forecast for next periods
  static generateForecast(analysisData, userCurrency = 'USD', periods = 3) {
    const forecasts = [];
    const { avgMonthlySpending, spendingTrend, totalBudget } = analysisData;

    for (let i = 1; i <= periods; i++) {
      let forecastAmount = avgMonthlySpending;
      
      // Adjust based on trend
      if (spendingTrend === 'increasing') {
        forecastAmount *= (1 + (0.05 * i)); // 5% increase per period
      } else if (spendingTrend === 'decreasing') {
        forecastAmount *= (1 - (0.03 * i)); // 3% decrease per period
      }

      const period = this.getNextPeriodName(i);
      const budgetStatus = totalBudget > 0 ? (forecastAmount / totalBudget) * 100 : null;
      
      forecasts.push({
        period,
        forecastAmount: Math.round(forecastAmount),
        budgetUtilization: budgetStatus ? Math.round(budgetStatus) : null,
        trend: spendingTrend,
        formattedAmount: formatCurrency(forecastAmount, userCurrency)
      });
    }

    return forecasts;
  }

  // Generate cash flow insights and tips
  static generateCashFlowTips(analysisData, forecasts, userCurrency = 'USD') {
    const tips = [];
    const { avgMonthlySpending, spendingTrend, budgetUtilization, topCategories } = analysisData;

    // Trend-based tips
    if (spendingTrend === 'increasing') {
      tips.push(`📈 Your spending is trending upward. Consider reviewing your ${topCategories[0]?.category || 'top'} expenses to identify savings opportunities.`);
    } else if (spendingTrend === 'decreasing') {
      tips.push(`📉 Great job reducing spending! You're saving an average of ${formatCurrency(avgMonthlySpending * 0.1, userCurrency)} monthly.`);
    } else {
      tips.push(`📊 Your spending is stable. Consider setting up automatic savings to build wealth consistently.`);
    }

    // Budget utilization tips
    if (budgetUtilization > 90) {
      tips.push(`⚠️ You're using ${Math.round(budgetUtilization)}% of your budget. Focus on reducing ${topCategories[0]?.category || 'top category'} expenses.`);
    } else if (budgetUtilization < 70) {
      tips.push(`🎉 You're only using ${Math.round(budgetUtilization)}% of your budget! Consider investing the surplus for long-term growth.`);
    }

    // Forecast-based tips
    if (forecasts && forecasts.length > 0) {
      const nextMonth = forecasts[0];
      if (nextMonth.budgetUtilization && nextMonth.budgetUtilization > 100) {
        tips.push(`🚨 Forecast Alert: Next period spending may exceed budget by ${nextMonth.budgetUtilization - 100}%. Plan accordingly.`);
      } else {
        tips.push(`🔮 Forecast: Next period estimated spending is ${nextMonth.formattedAmount}. Stay on track with your goals!`);
      }
    }

    // Category-specific tips
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      const categoryPercent = (topCategory.amount / analysisData.totalSpent) * 100;
      if (categoryPercent > 40) {
        tips.push(`💡 ${topCategory.category} represents ${Math.round(categoryPercent)}% of spending. Small reductions here can yield big savings.`);
      }
    }

    // Seasonal tips (if applicable)
    if (analysisData.seasonalPatterns.length > 0) {
      const highestSeason = analysisData.seasonalPatterns[0];
      tips.push(`🗓️ Historical data shows higher spending in ${highestSeason.month}. Plan and budget extra for seasonal variations.`);
    }

    // Add region-specific cash flow advice based on currency
    const regionTip = this.getRegionSpecificCashFlowTip(userCurrency, avgMonthlySpending);
    if (regionTip) {
      tips.push(regionTip);
    }

    // General cash flow management tips
    const generalTips = [
      `💰 Emergency fund tip: Aim for 3-6 months of expenses (${formatCurrency(avgMonthlySpending * 3, userCurrency)} - ${formatCurrency(avgMonthlySpending * 6, userCurrency)}).`,
      `📱 Use the 24-hour rule: Wait a day before purchases over ${formatCurrency(100, userCurrency)} to avoid impulse spending.`,
      `🎯 Automate savings: Set up automatic transfers of 10-20% of income to build wealth effortlessly.`,
      `📊 Track daily expenses for better cash flow awareness and control over your financial future.`
    ];

    // Add a random general tip if we don't have enough specific tips
    if (tips.length < 2) {
      const randomTip = generalTips[Math.floor(Math.random() * generalTips.length)];
      tips.push(randomTip);
    }

    return tips;
  }
  
  // Region-specific cash flow tips based on currency
  static getRegionSpecificCashFlowTip(currency, avgMonthlySpending) {
    const regionTips = {
      'ZAR': [
        `🇿🇦 South African savers: Consider a tax-free savings account with a 36,000 ZAR annual limit and lifetime limit of 500,000 ZAR.`,
        `🇿🇦 South African banks like Capitec, TymeBank, and Discovery offer high-interest savings accounts - compare rates monthly.`,
        `🇿🇦 Consider unit trusts from providers like Allan Gray or Coronation for cash flow growth in South Africa.`
      ],
      'USD': [
        `🇺🇸 US savers: High-yield savings accounts currently offer 4-5% APY, substantially better than traditional bank rates.`,
        `🇺🇸 Consider I-Bonds for emergency funds in the US - they adjust with inflation to protect your cash reserves.`,
        `🇺🇸 US cash flow tip: Use Roth IRA contributions strategically - they can be withdrawn penalty-free if needed.`
      ],
      'EUR': [
        `🇪🇺 European savers can use multi-currency accounts from Wise or Revolut for more flexible cash management.`,
        `🇪🇺 Consider European money market funds for temporary cash parking with better returns than savings accounts.`,
        `🇪🇺 European cash flow tip: SEPA instant transfers enable fast, free money movement across eurozone countries.`
      ],
      'GBP': [
        `🇬🇧 UK savers: Premium Bonds offer tax-free prizes up to £1 million while preserving your capital.`,
        `🇬🇧 UK cash flow tip: Consider Cash ISAs for tax-free interest on emergency and short-term savings.`,
        `🇬🇧 Compare UK regular savings accounts which can offer higher rates (3-5%) for monthly deposits.`
      ],
      'AUD': [
        `🇦🇺 Australian savers: Compare high-interest savings accounts which can offer 4%+ with bonus conditions.`,
        `🇦🇺 Consider Australian micro-investing apps like Raiz for automated roundups to boost your cash flow.`,
        `🇦🇺 Australian cash flow tip: Look into offset accounts to reduce mortgage interest while maintaining liquidity.`
      ],
      'CAD': [
        `🇨🇦 Canadian savers: Tax-Free Savings Accounts (TFSAs) offer tax-free growth for emergency and short-term funds.`,
        `🇨🇦 Compare high-interest savings accounts from online banks like EQ Bank or Tangerine for better rates.`,
        `🇨🇦 Canadian cash flow tip: Consider a TFSA for your emergency fund to grow tax-free while remaining accessible.`
      ],
      'JPY': [
        `🇯🇵 Japanese savers: Consider J-REITs for higher yield than traditional bank deposits while maintaining liquidity.`,
        `🇯🇵 Look into "NISA" accounts for tax-advantaged investing to improve long-term cash flow in Japan.`,
        `🇯🇵 Japanese cash flow tip: Money Reserve Funds (MRFs) can offer slightly better returns than bank deposits.`
      ]
    };
    
    if (regionTips[currency]) {
      return regionTips[currency][Math.floor(Math.random() * regionTips[currency].length)];
    }
    
    return null;
  }

  // Helper method to get a single cash flow tip
  static getSingleCashFlowTip(expenses = [], budgets = [], userCurrency = 'USD') {
    try {
      const analysisData = this.analyzeSpendingPatterns(expenses, budgets);
      const forecasts = this.generateForecast(analysisData, userCurrency, 1);
      const tips = this.generateCashFlowTips(analysisData, forecasts, userCurrency);
      
      return tips.length > 0 ? tips[0] : this.getFallbackCashFlowTip(userCurrency);
    } catch (error) {
      console.error('Error generating cash flow tip:', error);
      return this.getFallbackCashFlowTip(userCurrency);
    }
  }

  // Get multiple cash flow tips
  static getMultipleCashFlowTips(expenses = [], budgets = [], userCurrency = 'USD') {
    try {
      const analysisData = this.analyzeSpendingPatterns(expenses, budgets);
      const forecasts = this.generateForecast(analysisData, userCurrency, 2);
      const tips = this.generateCashFlowTips(analysisData, forecasts, userCurrency);
      
      // If we have tips and no region-specific tip is included, add one
      if (tips.length > 0) {
        // Check if we already have a region-specific tip (look for country flag emoji)
        const hasRegionTip = tips.some(tip => tip.includes(`🇿🇦`) || tip.includes(`🇺🇸`) || 
                                             tip.includes(`🇬🇧`) || tip.includes(`🇪🇺`) ||
                                             tip.includes(`🇦🇺`) || tip.includes(`🇨🇦`) || 
                                             tip.includes(`🇯🇵`));
        
        // If no region tip exists, add one
        if (!hasRegionTip) {
          const regionTip = this.getRegionSpecificCashFlowTip(userCurrency, analysisData.avgMonthlySpending);
          if (regionTip) {
            tips.push(regionTip);
          }
        }
        
        // Include a prediction tip if we have forecast data
        if (forecasts && forecasts.length > 0 && !tips.some(tip => tip.includes('🔮') || tip.includes('forecast'))) {
          const nextMonth = forecasts[0];
          tips.push(`🔮 Cash flow prediction: Your ${nextMonth.period} spending is estimated at ${nextMonth.formattedAmount} based on current patterns.`);
        }
        
        return tips.slice(0, 3); // Return up to 3 tips
      }
      
      return [this.getFallbackCashFlowTip(userCurrency)];
    } catch (error) {
      console.error('Error generating multiple cash flow tips:', error);
      return [this.getFallbackCashFlowTip(userCurrency)];
    }
  }

  // Fallback cash flow tip when analysis fails
  static getFallbackCashFlowTip(userCurrency = 'USD') {
    // General cash flow tips for all regions
    const generalTips = [
      `💡 Start building your emergency fund with ${formatCurrency(500, userCurrency)} to improve your cash flow security.`,
      `📊 Track your expenses for 30 days to understand your cash flow patterns and identify savings opportunities.`,
      `🎯 Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings to optimize your cash flow management.`,
      `💰 Automate bill payments to avoid late fees and improve your monthly cash flow predictability.`,
      `📈 Review your spending weekly to stay ahead of cash flow issues and build better financial habits.`
    ];
    
    // Currency/region-specific cash flow tips
    const currencySpecificTips = {
      'ZAR': [
        `🇿🇦 South African tip: Build an emergency fund of 3-6 months of expenses (about R50,000-R100,000 for the average household).`,
        `🇿🇦 Consider South African tax-free savings accounts with R36,000 annual contribution limits for flexible cash reserves.`,
        `🇿🇦 South African banks like TymeBank and Capitec offer competitive interest rates for emergency funds and short-term savings.`
      ],
      'USD': [
        `🇺🇸 US tip: High-yield savings accounts currently offer 4-5% APY for emergency funds - much better than traditional banks.`,
        `🇺🇸 US savers should consider I-Bonds which adjust with inflation, currently offering better rates than savings accounts.`,
        `🇺🇸 Money market funds from Vanguard or Fidelity offer competitive yields for short-term cash needs in the US.`
      ],
      'EUR': [
        `🇪🇺 Euro tip: Build an emergency fund of 3-6 months expenses in a flexible savings account before longer-term investing.`,
        `🇪🇺 Consider multi-currency accounts from Wise or Revolut for flexible cash management across Europe.`,
        `🇪🇺 European money market funds can offer better returns than savings accounts for short-term cash needs.`
      ],
      'GBP': [
        `🇬🇧 UK tip: Consider Premium Bonds for emergency savings - they offer tax-free prize draws while preserving capital.`,
        `🇬🇧 Cash ISAs protect your emergency fund interest from tax while maintaining accessibility for UK savers.`,
        `🇬🇧 Compare UK regular savings accounts which can offer higher rates (3-5%) for monthly deposits.`
      ],
      'AUD': [
        `🇦🇺 Australian tip: High-interest savings accounts can offer 4%+ with bonus conditions for emergency funds.`,
        `🇦🇺 Consider offset accounts linked to your mortgage to effectively earn your mortgage interest rate on cash savings.`,
        `🇦🇺 Australian micro-investing apps like Raiz can help automate saving small amounts to build your emergency fund.`
      ],
      'CAD': [
        `🇨🇦 Canadian tip: Keep 3-6 months of expenses in a Tax-Free Savings Account (TFSA) for tax-efficient emergency savings.`,
        `🇨🇦 Online banks like EQ Bank offer significantly higher interest rates than traditional Canadian banks.`,
        `🇨🇦 Canadian cashback credit cards can return 1-4% on everyday purchases to boost your cash flow when paid in full monthly.`
      ],
      'JPY': [
        `🇯🇵 Japanese tip: Consider "NISA" accounts for tax-advantaged investing to improve long-term cash flow.`,
        `🇯🇵 Money Reserve Funds (MRFs) can offer slightly better returns than traditional Japanese bank deposits.`,
        `🇯🇵 Japanese J-REITs can provide higher yield than bank deposits while maintaining relative liquidity for cash needs.`
      ]
    };
    
    // Combine general and region-specific tips
    let combinedTips = [...generalTips];
    
    if (currencySpecificTips[userCurrency]) {
      combinedTips = combinedTips.concat(currencySpecificTips[userCurrency]);
    }
    
    return combinedTips[Math.floor(Math.random() * combinedTips.length)];
  }

  // Helper methods
  static getDaysInPeriod(expenses) {
    if (!expenses || expenses.length === 0) return 1;
    
    const dates = expenses.map(exp => new Date(exp.date));
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    return Math.max(1, Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)));
  }

  static getMonthsInPeriod(expenses) {
    if (!expenses || expenses.length === 0) return 1;
    
    const dates = expenses.map(exp => new Date(exp.date));
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    return Math.max(1, Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24 * 30)));
  }

  static getMonthName(monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex] || 'Unknown';
  }

  static getNextPeriodName(periodOffset) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
    return this.getMonthName(nextMonth.getMonth()) + ' ' + nextMonth.getFullYear();
  }
}

export default CashFlowForecastingService;