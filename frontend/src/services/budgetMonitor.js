/**
 * Budget monitoring service that triggers notifications when budgets are exceeded
 */

import NotificationService from './notificationService';
import * as ApiService from './api';
import { formatCurrency, getCurrencySymbol } from '../utils/helpers';

class BudgetMonitorService {
  constructor() {
    this.isEnabled = true;
    this.loadSettings();
  }

  loadSettings() {
    const notificationPreferences = localStorage.getItem('notificationPreferences');
    if (notificationPreferences) {
      const prefs = JSON.parse(notificationPreferences);
      this.isEnabled = prefs.budgetAlerts !== false;
    }
  }

  /**
   * Check budgets after an expense is added
   */
  async checkBudgetsAfterExpense(expenseData, userCurrency = 'ZAR') {
    if (!this.isEnabled) {
      console.log('🚨 Budget alerts disabled, skipping check');
      return;
    }

    try {
      console.log('🚨 Checking budgets after expense:', expenseData);
      
      // Get current budgets for this month
      const now = new Date();
      const budgets = await ApiService.getBudgets({
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });

      if (!budgets || budgets.length === 0) {
        console.log('🚨 No budgets found for current month');
        return;
      }

      // Find the budget for the expense category
      const relevantBudget = budgets.find(budget => 
        budget.category === expenseData.category
      );

      if (!relevantBudget) {
        console.log('🚨 No budget found for category:', expenseData.category);
        return;
      }

      // Calculate percentage spent
      const spentAmount = relevantBudget.currentSpent || 0;
      const budgetLimit = relevantBudget.monthlyLimit;
      const percentage = Math.round((spentAmount / budgetLimit) * 100);

      console.log(`🚨 Budget check: ${percentage}% spent (${spentAmount}/${budgetLimit}) for ${expenseData.category}`);

      // Trigger notifications based on percentage
      if (percentage >= 100) {
        // Over budget - immediate alert
        await this.triggerBudgetAlert(
          relevantBudget.category,
          spentAmount,
          budgetLimit,
          'over',
          userCurrency
        );
      } else if (percentage >= 90) {
        // Close to budget limit - warning
        await this.triggerBudgetAlert(
          relevantBudget.category,
          spentAmount,
          budgetLimit,
          'warning',
          userCurrency
        );
      } else if (percentage >= 80) {
        // Getting close - info
        await this.triggerBudgetAlert(
          relevantBudget.category,
          spentAmount,
          budgetLimit,
          'info',
          userCurrency
        );
      }

    } catch (error) {
      console.error('🚨 Error checking budgets:', error);
    }
  }

  /**
   * Trigger a budget alert notification
   */
  async triggerBudgetAlert(category, spentAmount, budgetLimit, alertType, userCurrency = 'ZAR') {
    const percentage = Math.round((spentAmount / budgetLimit) * 100);
    const categoryName = this.getCategoryDisplayName(category);
    const currencySymbol = getCurrencySymbol(userCurrency);
    const region = this.getRegionFromCurrency(userCurrency);

    // Format amounts with proper currency
    const spentFormatted = formatCurrency(spentAmount, userCurrency);
    const budgetFormatted = formatCurrency(budgetLimit, userCurrency);
    const remainingFormatted = formatCurrency(budgetLimit - spentAmount, userCurrency);

    let title, body, emoji;

    switch (alertType) {
      case 'over':
        emoji = '🚨';
        title = `Budget Exceeded! ${this.getRegionFlag(userCurrency)}`;
        body = `You've spent ${percentage}% of your ${categoryName} budget (${spentFormatted}/${budgetFormatted})`;
        break;
      case 'warning':
        emoji = '⚠️';
        title = `Budget Warning ${this.getRegionFlag(userCurrency)}`;
        body = `You're at ${percentage}% of your ${categoryName} budget. ${remainingFormatted} remaining`;
        break;
      case 'info':
        emoji = '💡';
        title = `Budget Update ${this.getRegionFlag(userCurrency)}`;
        body = `You've used ${percentage}% of your ${categoryName} budget this month`;
        break;
      default:
        return;
    }

    console.log(`🚨 Triggering ${alertType} alert for ${categoryName}: ${body}`);

    try {
      await NotificationService.scheduleBudgetAlert(categoryName, spentAmount, budgetLimit);
      console.log('🚨 Budget alert notification scheduled successfully');
    } catch (error) {
      console.error('🚨 Failed to schedule budget alert:', error);
    }
  }

  /**
   * Get display name for category
   */
  getCategoryDisplayName(category) {
    const categoryMap = {
      'FOOD_DINING': 'Food & Dining',
      'TRANSPORTATION': 'Transportation',
      'SHOPPING': 'Shopping',
      'ENTERTAINMENT': 'Entertainment',
      'BILLS_UTILITIES': 'Bills & Utilities',
      'HEALTHCARE': 'Healthcare',
      'EDUCATION': 'Education',
      'TRAVEL': 'Travel',
      'PERSONAL_CARE': 'Personal Care',
      'GIFTS_DONATIONS': 'Gifts & Donations',
      'INVESTMENTS': 'Investments',
      'OTHER': 'Other'
    };

    return categoryMap[category] || category;
  }

  /**
   * Get region from currency code
   */
  getRegionFromCurrency(currency) {
    const regions = {
      'ZAR': 'South Africa',
      'USD': 'United States',
      'EUR': 'Europe',
      'GBP': 'United Kingdom',
      'JPY': 'Japan',
      'CAD': 'Canada',
      'AUD': 'Australia',
      'CHF': 'Switzerland',
      'CNY': 'China',
      'INR': 'India',
      'NGN': 'Nigeria',
      'KES': 'Kenya',
      'BWP': 'Botswana',
      'NAD': 'Namibia'
    };
    return regions[currency] || 'International';
  }

  /**
   * Get flag emoji for currency/region
   */
  getRegionFlag(currency) {
    const flags = {
      'ZAR': '🇿🇦',
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'JPY': '🇯🇵',
      'CAD': '🇨🇦',
      'AUD': '🇦🇺',
      'CHF': '🇨🇭',
      'CNY': '🇨🇳',
      'INR': '🇮🇳',
      'NGN': '🇳🇬',
      'KES': '🇰🇪',
      'BWP': '🇧🇼',
      'NAD': '🇳🇦'
    };
    return flags[currency] || '🌍';
  }

  /**
   * Enable/disable budget monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🚨 Budget monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check all budgets manually (for testing)
   */
  async checkAllBudgets() {
    if (!this.isEnabled) {
      console.log('🚨 Budget alerts disabled');
      return;
    }

    try {
      const now = new Date();
      const budgets = await ApiService.getBudgets({
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });

      console.log('🚨 Checking all budgets:', budgets);

      for (const budget of budgets) {
        const percentage = Math.round((budget.currentSpent / budget.monthlyLimit) * 100);
        
        if (percentage >= 80) {
          const alertType = percentage >= 100 ? 'over' : percentage >= 90 ? 'warning' : 'info';
          await this.triggerBudgetAlert(
            budget.category,
            budget.currentSpent,
            budget.monthlyLimit,
            alertType
          );
        }
      }

    } catch (error) {
      console.error('🚨 Error checking all budgets:', error);
    }
  }
}

export default new BudgetMonitorService();
