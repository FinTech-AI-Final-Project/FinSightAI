
package com.finsight.ai.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import com.finsight.ai.repository.BudgetRepository;
import com.finsight.ai.repository.ExpenseRepository;
import com.finsight.ai.repository.UserRepository;

import reactor.core.publisher.Mono;

@Service
public class ChatbotService {
    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    /**
     * Handles AI-generated SQL queries for custom user requests.
     * @param userMessage The user's natural language question.
     * @param user The user object.
     * @return The formatted result or AI explanation.
     */
    public String handleAIQuery(String userMessage, User user) {
        // Provide schema context for the AI agent
    String schemaContext = "Schema: EXPENSES(id, user_id, amount, category, description, date, receipt_url), " +
        "BUDGETS(id, user_id, category, monthly_limit, current_spent, month, year), " +
        "CATEGORIES: " + String.join(", ",
            java.util.Arrays.stream(ExpenseCategory.values()).map(ExpenseCategory::getDisplayName).toList());

        // Build prompt for AI agent
        String prompt = String.format("User question: '%s'\n%s\nGenerate a SQL query to answer this question using the schema above. Return the SQL and a brief explanation.",
                userMessage, schemaContext);

        // Call AI agent to get SQL and explanation
        String aiResponse = aiTipsService.generateContextualResponse(user, prompt);

        // Extract SQL from AI response (simple pattern match)
        Pattern sqlPattern = Pattern.compile("SELECT[\\s\\S]+?;", Pattern.CASE_INSENSITIVE);
        Matcher matcher = sqlPattern.matcher(aiResponse);
        String sql = matcher.find() ? matcher.group() : null;

        if (sql != null) {
            // Validate SQL (basic check: only SELECT allowed)
            if (!sql.trim().toUpperCase().startsWith("SELECT")) {
                return "AI-generated query is not allowed. Only SELECT statements are permitted.";
            }
            try {
                // Execute SQL safely using JdbcTemplate
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
                StringBuilder formatted = new StringBuilder();
                formatted.append("AI-generated SQL: ").append(sql).append("\n");
                formatted.append("Explanation: ").append(aiResponse.replace(sql, "").trim()).append("\n");
                if (results.isEmpty()) {
                    formatted.append("No results found for your query.");
                } else {
                    formatted.append("Results:\n");
                    for (Map<String, Object> row : results) {
                        for (Map.Entry<String, Object> entry : row.entrySet()) {
                            formatted.append(entry.getKey()).append(": ").append(entry.getValue()).append("; ");
                        }
                        formatted.append("\n");
                    }
                }
                return formatted.toString();
            } catch (Exception e) {
                return "Error executing AI-generated query: " + e.getMessage();
            }
        } else {
            // If no SQL found, return AI explanation
            return "AI could not generate a valid SQL query.\n" + aiResponse;
        }
    }

    private static final Logger logger = LoggerFactory.getLogger(ChatbotService.class);

    @Autowired
    private ExpenseRepository expenseRepository;
    @Autowired
    private BudgetRepository budgetRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CurrencyService currencyService;
    @Autowired
    private AITipsService aiTipsService;

    @Value("${gradient.ai.agent.api.url:}")
    private String aiAgentApiUrl;

    @Value("${gradient.ai.agent.api.key:}")
    private String aiAgentApiKey;

    private final WebClient webClient;

    public ChatbotService() {
        this.webClient = WebClient.builder().build();
    }

    public String getChatbotReply(String userMessage, String userId, String currency) {
        try {
            Optional<User> userOpt = userRepository.findByFirebaseUid(userId);
            if (!userOpt.isPresent()) {
                return "I couldn't find your account information. Please try logging in again.";
            }

            User user = userOpt.get();

            // Build full context for AI agent
            String schemaContext = "Schema: EXPENSES(id, user_id, amount, category, description, date, receipt_url), " +
                    "BUDGETS(id, user_id, category, monthly_limit, current_spent, month, year), " +
                    "CATEGORIES: " + String.join(", ",
                        java.util.Arrays.stream(ExpenseCategory.values()).map(ExpenseCategory::getDisplayName).toList());

            // Add user financial context
            LocalDate now = LocalDate.now();
            LocalDate monthStart = now.withDayOfMonth(1);
            List<Object[]> categoryData = expenseRepository.getExpensesByCategoryBetweenDates(user, monthStart, now);
            StringBuilder breakdown = new StringBuilder();
            breakdown.append("Category breakdown this month:\n");
            for (Object[] data : categoryData) {
                ExpenseCategory cat = (ExpenseCategory) data[0];
                BigDecimal amount = (BigDecimal) data[1];
                breakdown.append(String.format("- %s: %s\n", cat.getDisplayName(), currencyService.formatAmount(amount.doubleValue(), currency)));
            }

            // Compose prompt for AI agent
            String prompt = String.format(
                "User question: '%s'\n%s\n%s\nPlease answer the user's question using the schema and financial data above. Do NOT include SQL code or technical details in your answer. Only provide clear, concise, and user-friendly responses (1-2 sentences). If you need to provide a tip or advice, keep it under 30 words.",
                userMessage, schemaContext, breakdown);

            // Call AI agent for every query
            String aiResponse = aiTipsService.generateContextualResponse(user, prompt);

            // Try to extract and execute SQL if present
                Pattern sqlPattern = Pattern.compile("SELECT[\\s\\S]+?;", Pattern.CASE_INSENSITIVE);
                Matcher matcher = sqlPattern.matcher(aiResponse);
                String sql = matcher.find() ? matcher.group() : null;
            if (sql != null && sql.trim().toUpperCase().startsWith("SELECT")) {
                try {
                    List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
                    StringBuilder formatted = new StringBuilder();
                    formatted.append("AI-generated SQL: ").append(sql).append("\n");
                    formatted.append("Explanation: ").append(aiResponse.replace(sql, "").trim()).append("\n");
                    if (results.isEmpty()) {
                        formatted.append("No results found for your query.");
                    } else {
                        formatted.append("Results:\n");
                        for (Map<String, Object> row : results) {
                            for (Map.Entry<String, Object> entry : row.entrySet()) {
                                formatted.append(entry.getKey()).append(": ").append(entry.getValue()).append("; ");
                            }
                            formatted.append("\n");
                        }
                    }
                    return formatted.toString();
                } catch (Exception e) {
                    return "Error executing AI-generated query: " + e.getMessage();
                }
            }
            // Otherwise, return AI response
            return aiResponse;
        } catch (Exception e) {
            logger.error("Error processing chatbot request for user: {}", userId, e);
            return "I'm experiencing technical difficulties. Please try again in a moment.";
        }
    }

    // All queries are now handled by the AI agent. No hardcoded logic needed.

    private String handleSpendingQueries(String msg, User user, String currency, LocalDate now) {
        // Last month
        if (containsAny(msg, "last month", "previous month")) {
            LocalDate lastMonth = now.minusMonths(1);
            LocalDate start = lastMonth.withDayOfMonth(1);
            LocalDate end = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, start, end);
            if (amount == null) amount = BigDecimal.ZERO;
            String monthName = lastMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            return String.format("You spent %s in %s %d.", 
                currencyService.formatAmount(amount.doubleValue(), currency), 
                monthName, lastMonth.getYear());
        }
        
        // This month
        if (containsAny(msg, "this month", "current month")) {
            LocalDate start = now.withDayOfMonth(1);
            LocalDate end = now;
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, start, end);
            if (amount == null) amount = BigDecimal.ZERO;
            String monthName = now.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            return String.format("You've spent %s so far in %s %d.", 
                currencyService.formatAmount(amount.doubleValue(), currency), 
                monthName, now.getYear());
        }
        
        // This week
        if (containsAny(msg, "this week", "current week")) {
            LocalDate startOfWeek = now.with(DayOfWeek.MONDAY);
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, startOfWeek, now);
            if (amount == null) amount = BigDecimal.ZERO;
            return String.format("You've spent %s this week.", 
                currencyService.formatAmount(amount.doubleValue(), currency));
        }
        
        // Today
        if (containsAny(msg, "today", "today's")) {
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, now, now);
            if (amount == null) amount = BigDecimal.ZERO;
            return String.format("You've spent %s today.", 
                currencyService.formatAmount(amount.doubleValue(), currency));
        }
        
        // Yesterday
        if (containsAny(msg, "yesterday")) {
            LocalDate yesterday = now.minusDays(1);
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, yesterday, yesterday);
            if (amount == null) amount = BigDecimal.ZERO;
            return String.format("You spent %s yesterday.", 
                currencyService.formatAmount(amount.doubleValue(), currency));
        }
        
        // Specific category spending
        ExpenseCategory category = extractCategory(msg);
        if (category != null) {
            if (containsAny(msg, "last month")) {
                LocalDate lastMonth = now.minusMonths(1);
                LocalDate start = lastMonth.withDayOfMonth(1);
                LocalDate end = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
                BigDecimal amount = expenseRepository.getTotalExpensesByCategoryBetweenDates(user, category, start, end);
                if (amount == null) amount = BigDecimal.ZERO;
                return String.format("You spent %s on %s last month.", 
                    currencyService.formatAmount(amount.doubleValue(), currency), 
                    category.getDisplayName());
            } else {
                LocalDate start = now.withDayOfMonth(1);
                BigDecimal amount = expenseRepository.getTotalExpensesByCategoryBetweenDates(user, category, start, now);
                if (amount == null) amount = BigDecimal.ZERO;
                return String.format("You've spent %s on %s this month.", 
                    currencyService.formatAmount(amount.doubleValue(), currency), 
                    category.getDisplayName());
            }
        }
        
        return "I can tell you how much you've spent today, yesterday, this week, this month, or last month. You can also ask about specific categories.";
    }

    private String handleBudgetQueries(String msg, User user, String currency, LocalDate now) {
        // Budget overview
        if (containsAny(msg, "all", "total", "overview")) {
            var budgets = budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
            if (budgets.isEmpty()) {
                return "You don't have any budgets set for this month.";
            }
            
            BigDecimal totalBudget = budgets.stream()
                .map(b -> b.getMonthlyLimit())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalSpent = budgets.stream()
                .map(b -> b.getCurrentSpent() != null ? b.getCurrentSpent() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            return String.format("Your total budget for %s is %s. You've spent %s (%s remaining).", 
                now.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                currencyService.formatAmount(totalBudget.doubleValue(), currency),
                currencyService.formatAmount(totalSpent.doubleValue(), currency),
                currencyService.formatAmount(totalBudget.subtract(totalSpent).doubleValue(), currency));
        }
        
        // Over budget check
        if (containsAny(msg, "over", "exceeded", "above")) {
            var budgets = budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
            List<String> overBudgetCategories = new ArrayList<>();
            
            for (var budget : budgets) {
                BigDecimal spent = budget.getCurrentSpent() != null ? budget.getCurrentSpent() : BigDecimal.ZERO;
                if (spent.compareTo(budget.getMonthlyLimit()) > 0) {
                    overBudgetCategories.add(budget.getCategory().getDisplayName());
                }
            }
            
            if (overBudgetCategories.isEmpty()) {
                return "Great news! You're within budget for all categories this month.";
            } else {
                return "You're over budget for: " + String.join(", ", overBudgetCategories) + ".";
            }
        }
        
        // Specific category budget
        ExpenseCategory category = extractCategory(msg);
        if (category != null) {
            var budgetOpt = budgetRepository.findByUserAndCategoryAndMonthAndYear(user, category, now.getMonthValue(), now.getYear());
            if (!budgetOpt.isPresent()) {
                return String.format("You don't have a budget set for %s this month.", category.getDisplayName());
            }
            
            var budget = budgetOpt.get();
            BigDecimal spent = budget.getCurrentSpent() != null ? budget.getCurrentSpent() : BigDecimal.ZERO;
            BigDecimal remaining = budget.getMonthlyLimit().subtract(spent);
            
            return String.format("Your %s budget: %s limit, %s spent, %s remaining.", 
                category.getDisplayName(),
                currencyService.formatAmount(budget.getMonthlyLimit().doubleValue(), currency),
                currencyService.formatAmount(spent.doubleValue(), currency),
                currencyService.formatAmount(remaining.doubleValue(), currency));
        }
        
        return "I can tell you about your budget overview, check if you're over budget, or give details about specific category budgets.";
    }

    private String handleCategoryQueries(String msg, User user, String currency, LocalDate now) {
        LocalDate start, end;
        String period;
        
        if (containsAny(msg, "last month")) {
            LocalDate lastMonth = now.minusMonths(1);
            start = lastMonth.withDayOfMonth(1);
            end = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            period = "last month";
        } else {
            start = now.withDayOfMonth(1);
            end = now;
            period = "this month";
        }
        
        List<Object[]> categoryData = expenseRepository.getExpensesByCategoryBetweenDates(user, start, end);
        
        if (categoryData.isEmpty()) {
            return String.format("You don't have any expenses recorded for %s.", period);
        }
        
        // Find largest spending category
        if (containsAny(msg, "largest", "highest", "most", "biggest")) {
            Object[] largest = categoryData.stream()
                .max(Comparator.comparing(arr -> (BigDecimal) arr[1]))
                .orElse(null);
            
            if (largest != null) {
                ExpenseCategory cat = (ExpenseCategory) largest[0];
                BigDecimal amount = (BigDecimal) largest[1];
                return String.format("Your largest spending category %s is %s with %s.", 
                    period, cat.getDisplayName(), 
                    currencyService.formatAmount(amount.doubleValue(), currency));
            }
        }
        
        // Category breakdown
        if (containsAny(msg, "breakdown", "all", "list")) {
            StringBuilder result = new StringBuilder();
            result.append(String.format("Your spending by category %s:\n", period));
            
            categoryData.sort((a, b) -> ((BigDecimal) b[1]).compareTo((BigDecimal) a[1]));
            
            for (Object[] data : categoryData) {
                ExpenseCategory cat = (ExpenseCategory) data[0];
                BigDecimal amount = (BigDecimal) data[1];
                result.append(String.format("• %s: %s\n", 
                    cat.getDisplayName(), 
                    currencyService.formatAmount(amount.doubleValue(), currency)));
            }
            
            return result.toString().trim();
        }
        
        return "I can show you your largest spending category or give you a complete breakdown by category.";
    }

    private String handleTransactionQueries(String msg, User user, LocalDate now) {
        LocalDate start, end;
        String period;
        
        if (containsAny(msg, "today")) {
            start = end = now;
            period = "today";
        } else if (containsAny(msg, "yesterday")) {
            start = end = now.minusDays(1);
            period = "yesterday";
        } else if (containsAny(msg, "this week")) {
            start = now.with(DayOfWeek.MONDAY);
            end = now;
            period = "this week";
        } else if (containsAny(msg, "last week")) {
            start = now.minusWeeks(1).with(DayOfWeek.MONDAY);
            end = start.plusDays(6);
            period = "last week";
        } else if (containsAny(msg, "this month")) {
            start = now.withDayOfMonth(1);
            end = now;
            period = "this month";
        } else if (containsAny(msg, "last month")) {
            LocalDate lastMonth = now.minusMonths(1);
            start = lastMonth.withDayOfMonth(1);
            end = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            period = "last month";
        } else {
            start = now.withDayOfMonth(1);
            end = now;
            period = "this month";
        }
        
        List<com.finsight.ai.entity.Expense> expenses = expenseRepository.findByUserAndDateBetweenOrderByDateDesc(user, start, end);
        int count = expenses.size();
        
        if (count == 0) {
            return String.format("You made no transactions %s.", period);
        } else if (count == 1) {
            return String.format("You made 1 transaction %s.", period);
        } else {
            return String.format("You made %d transactions %s.", count, period);
        }
    }

    private String handleAverageQueries(String msg, User user, String currency) {
        if (containsAny(msg, "daily")) {
            List<com.finsight.ai.entity.Expense> allExpenses = expenseRepository.findByUserOrderByDateDesc(user);
            if (allExpenses.isEmpty()) {
                return "You don't have any expenses recorded yet.";
            }
            
            BigDecimal total = allExpenses.stream()
                .map(com.finsight.ai.entity.Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            LocalDate firstExpenseDate = allExpenses.get(allExpenses.size() - 1).getDate();
            long daysBetween = ChronoUnit.DAYS.between(firstExpenseDate, LocalDate.now()) + 1;
            
            BigDecimal avgDaily = total.divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);
            
            return String.format("Your average daily spending is %s.", 
                currencyService.formatAmount(avgDaily.doubleValue(), currency));
        }
        
        if (containsAny(msg, "monthly")) {
            List<Object[]> dailyData = expenseRepository.getDailyExpensesBetweenDates(user, 
                LocalDate.now().minusMonths(12), LocalDate.now());
            
            if (dailyData.isEmpty()) {
                return "You don't have enough expense history to calculate a monthly average.";
            }
            
            // Group by month and calculate monthly totals
            Map<String, BigDecimal> monthlyTotals = new HashMap<>();
            for (Object[] data : dailyData) {
                LocalDate date = (LocalDate) data[0];
                BigDecimal amount = (BigDecimal) data[1];
                String monthKey = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                monthlyTotals.merge(monthKey, amount, BigDecimal::add);
            }
            
            if (monthlyTotals.isEmpty()) {
                return "You don't have enough expense history to calculate a monthly average.";
            }
            
            BigDecimal totalMonthly = monthlyTotals.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avgMonthly = totalMonthly.divide(BigDecimal.valueOf(monthlyTotals.size()), 2, RoundingMode.HALF_UP);
            
            return String.format("Your average monthly spending is %s (based on %d months of data).", 
                currencyService.formatAmount(avgMonthly.doubleValue(), currency), monthlyTotals.size());
        }
        
        return "I can calculate your average daily or monthly spending. Just ask!";
    }

    private String handleDateSpecificQueries(String msg, User user, String currency, LocalDate now) {
        LocalDate queryDate = extractSpecificDate(msg, now);
        if (queryDate != null) {
            BigDecimal amount = expenseRepository.getTotalExpensesBetweenDates(user, queryDate, queryDate);
            if (amount == null) amount = BigDecimal.ZERO;
            return String.format("You spent %s on %s.", 
                currencyService.formatAmount(amount.doubleValue(), currency),
                queryDate.format(DateTimeFormatter.ofPattern("MMMM d, yyyy")));
        }
        
        return "Please specify a date like 'September 8th' or '8th of October'.";
    }

    private String handleComparisonQueries(String msg, User user, String currency, LocalDate now) {
        if (containsAny(msg, "this month", "last month")) {
            LocalDate thisMonth = now.withDayOfMonth(1);
            LocalDate lastMonth = now.minusMonths(1);
            LocalDate lastMonthStart = lastMonth.withDayOfMonth(1);
            LocalDate lastMonthEnd = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            
            BigDecimal thisMonthAmount = expenseRepository.getTotalExpensesBetweenDates(user, thisMonth, now);
            BigDecimal lastMonthAmount = expenseRepository.getTotalExpensesBetweenDates(user, lastMonthStart, lastMonthEnd);
            
            thisMonthAmount = thisMonthAmount != null ? thisMonthAmount : BigDecimal.ZERO;
            lastMonthAmount = lastMonthAmount != null ? lastMonthAmount : BigDecimal.ZERO;
            
            BigDecimal difference = thisMonthAmount.subtract(lastMonthAmount);
            String comparison = difference.compareTo(BigDecimal.ZERO) > 0 ? "more" : "less";
            
            return String.format("This month: %s, Last month: %s. You've spent %s %s this month.", 
                currencyService.formatAmount(thisMonthAmount.doubleValue(), currency),
                currencyService.formatAmount(lastMonthAmount.doubleValue(), currency),
                currencyService.formatAmount(difference.abs().doubleValue(), currency),
                comparison);
        }
        
        return "I can compare your spending between this month and last month.";
    }

    private String handleFeatureQuestions(String msg) {
        if (containsAny(msg, "receipt", "scan")) {
            return "Receipt scanning uses your phone's camera and OCR technology to automatically extract expense details from your receipts. Just take a photo and the app will fill in the amount, date, and merchant information.";
        }
        
        if (containsAny(msg, "budget", "work")) {
            return "Budgets help you control your spending by setting monthly limits for different categories. You'll get notifications when you're close to or over your budget limits.";
        }
        
        if (containsAny(msg, "categories", "organize")) {
            return "Categories help organize your expenses into groups like Food & Dining, Transportation, Entertainment, etc. This makes it easier to see where your money is going.";
        }
        
        return "I can explain how budgets, categories, receipt scanning, and other features work. Just ask!";
    }

    private String handleFinancialOverview(User user, String currency, LocalDate now) {
        // Get current month data
        LocalDate monthStart = now.withDayOfMonth(1);
        BigDecimal thisMonthSpent = expenseRepository.getTotalExpensesBetweenDates(user, monthStart, now);
        thisMonthSpent = thisMonthSpent != null ? thisMonthSpent : BigDecimal.ZERO;
        
        // Get budget data
        var budgets = budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
        BigDecimal totalBudget = budgets.stream()
            .map(b -> b.getMonthlyLimit())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get transaction count
        List<com.finsight.ai.entity.Expense> thisMonthExpenses = expenseRepository.findByUserAndDateBetweenOrderByDateDesc(user, monthStart, now);
        
        // Get top category
        List<Object[]> categoryData = expenseRepository.getExpensesByCategoryBetweenDates(user, monthStart, now);
        String topCategory = "None";
        if (!categoryData.isEmpty()) {
            Object[] largest = categoryData.stream()
                .max(Comparator.comparing(arr -> (BigDecimal) arr[1]))
                .orElse(null);
            if (largest != null) {
                topCategory = ((ExpenseCategory) largest[0]).getDisplayName();
            }
        }
        
        StringBuilder overview = new StringBuilder();
        overview.append("Here's your financial overview for ").append(now.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)).append(":\n");
        overview.append("💰 Total spent: ").append(currencyService.formatAmount(thisMonthSpent.doubleValue(), currency)).append("\n");
        overview.append("🎯 Total budget: ").append(currencyService.formatAmount(totalBudget.doubleValue(), currency)).append("\n");
        overview.append("📊 Transactions: ").append(thisMonthExpenses.size()).append("\n");
        overview.append("🏆 Top category: ").append(topCategory);
        
        return overview.toString();
    }

    private String getFinancialTip(String userMessage, User user, String currency) {
        // If AI agent is configured, use it for tips
        if (aiAgentApiUrl != null && !aiAgentApiUrl.isEmpty() && 
            aiAgentApiKey != null && !aiAgentApiKey.isEmpty()) {
            return getFinancialTipFromAI(user, currency);
        }

        // Fallback tips based on spending patterns
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);

        List<Object[]> categoryData = expenseRepository.getExpensesByCategoryBetweenDates(user, monthStart, now);
        if (categoryData.isEmpty()) {
            // AI fallback if no data
            String appDescription = "FinSight AI is a personal finance app with features including expense tracking, category breakdowns, budgets, receipt scanning, and AI-powered financial tips.";
            String prompt = String.format("User has no expenses recorded. App capabilities: %s. Please provide a motivational tip for starting to track expenses.", appDescription);
            return aiTipsService.generateContextualResponse(user, prompt);
        }

        // Find highest spending category and give relevant tip
        Object[] highest = categoryData.stream()
            .max(Comparator.comparing(arr -> (BigDecimal) arr[1]))
            .orElse(null);

        String tip = null;
        if (highest != null) {
            ExpenseCategory topCategory = (ExpenseCategory) highest[0];
            switch (topCategory) {
                case FOOD_DINING:
                    tip = "Your biggest expense is dining out. Try meal planning and cooking at home more often to save money.";
                    break;
                case TRANSPORTATION:
                    tip = "Transportation is your largest expense. Consider carpooling, public transport, or walking/cycling for short trips.";
                    break;
                case SHOPPING:
                    tip = "Shopping is taking up most of your budget. Try the 24-hour rule: wait a day before making non-essential purchases.";
                    break;
                case ENTERTAINMENT:
                    tip = "Entertainment spending is high. Look for free activities like parks, museums on free days, or home movie nights.";
                    break;
                default:
                    tip = "Review your spending regularly and set realistic budgets for each category to better control your finances.";
                    break;
            }
        } else {
            tip = "Track your expenses daily and review your spending patterns weekly to identify areas for improvement.";
        }

        // If tip is generic or not specific, use AI fallback with full category breakdown and app capabilities
        if (tip != null && (tip.startsWith("Review your spending regularly") || tip.startsWith("Track your expenses daily"))) {
            StringBuilder breakdown = new StringBuilder();
            breakdown.append("Category breakdown this month:\n");
            for (Object[] data : categoryData) {
                ExpenseCategory cat = (ExpenseCategory) data[0];
                BigDecimal amount = (BigDecimal) data[1];
                breakdown.append(String.format("- %s: %s\n", cat.getDisplayName(), currencyService.formatAmount(amount.doubleValue(), currency)));
            }
            String appDescription = "FinSight AI is a personal finance app with features including expense tracking, category breakdowns, budgets, receipt scanning, and AI-powered financial tips.";
            String prompt = String.format("User's category breakdown: %s\nApp capabilities: %s\nPlease provide a personalized financial tip based on this data.", breakdown, appDescription);
            return aiTipsService.generateContextualResponse(user, prompt);
        }

        return tip;
    }

    private String getFinancialTipFromAI(User user, String currency) {
        try {
            // Build context about user's spending
            LocalDate now = LocalDate.now();
            LocalDate monthStart = now.withDayOfMonth(1);
            BigDecimal thisMonthSpent = expenseRepository.getTotalExpensesBetweenDates(user, monthStart, now);
            
            var budgets = budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
            BigDecimal totalBudget = budgets.stream()
                .map(b -> b.getMonthlyLimit())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String prompt = String.format("Give %s a brief financial tip. They've spent %s of %s budget this month. Keep it practical and under 50 words.",
                user.getFirstName(),
                currencyService.formatAmount(thisMonthSpent != null ? thisMonthSpent.doubleValue() : 0.0, currency),
                currencyService.formatAmount(totalBudget.doubleValue(), currency));
            
            // Make AI API call
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 600);
            requestBody.put("temperature", 0.9);
            
            Mono<Map> response = webClient.post()
                .uri(aiAgentApiUrl + "/api/v1/chat/completions")
                .header("Authorization", "Bearer " + aiAgentApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class);
            
            Map<String, Object> responseData = response.block();
            if (responseData != null && responseData.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseData.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> aiMessage = (Map<String, Object>) firstChoice.get("message");
                    String tip = (String) aiMessage.get("content");
                    if (tip != null && !tip.trim().isEmpty()) {
                        return tip.trim();
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error getting AI tip for user: {}", user.getFirebaseUid(), e);
        }
        
        return "Set aside a small amount each week for savings, even if it's just 5% of your income.";
    }

    // Helper methods
    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsDateReferences(String msg) {
        return msg.matches(".*\\d{1,2}(st|nd|rd|th)? of (january|february|march|april|may|june|july|august|september|october|november|december).*") ||
               msg.matches(".*(january|february|march|april|may|june|july|august|september|october|november|december) \\d{1,2}(st|nd|rd|th)?.*") ||
               msg.matches(".*\\d{1,2}/\\d{1,2}.*") ||
               msg.matches(".*\\d{4}-\\d{2}-\\d{2}.*");
    }

    private LocalDate extractSpecificDate(String msg, LocalDate now) {
        // Pattern: "8th of October", "October 8th", etc.
        Pattern pattern = Pattern.compile("(\\d{1,2})(st|nd|rd|th)? of (january|february|march|april|may|june|july|august|september|october|november|december)");
        Matcher matcher = pattern.matcher(msg);
        
        if (matcher.find()) {
            int day = Integer.parseInt(matcher.group(1));
            String monthName = matcher.group(3);
            Month month = Month.valueOf(monthName.toUpperCase());
            int year = now.getYear();
            
            // If the month has passed this year, assume next year
            if (month.getValue() < now.getMonthValue()) {
                year++;
            }
            
            try {
                return LocalDate.of(year, month, day);
            } catch (Exception e) {
                return null;
            }
        }
        
        // Pattern: "October 8th", "September 15"
        pattern = Pattern.compile("(january|february|march|april|may|june|july|august|september|october|november|december) (\\d{1,2})(st|nd|rd|th)?");
        matcher = pattern.matcher(msg);
        
        if (matcher.find()) {
            String monthName = matcher.group(1);
            int day = Integer.parseInt(matcher.group(2));
            Month month = Month.valueOf(monthName.toUpperCase());
            int year = now.getYear();
            
            if (month.getValue() < now.getMonthValue()) {
                year++;
            }
            
            try {
                return LocalDate.of(year, month, day);
            } catch (Exception e) {
                return null;
            }
        }
        
        return null;
    }

    private ExpenseCategory extractCategory(String msg) {
        for (ExpenseCategory category : ExpenseCategory.values()) {
            String displayName = category.getDisplayName().toLowerCase();
            String enumName = category.name().toLowerCase().replace("_", " ");
            
            if (msg.contains(displayName) || msg.contains(enumName)) {
                return category;
            }
            
            // Check for common synonyms
            switch (category) {
                case FOOD_DINING:
                    if (containsAny(msg, "food", "dining", "restaurant", "eat")) return category;
                    break;
                case TRANSPORTATION:
                    if (containsAny(msg, "transport", "car", "gas", "fuel", "uber", "taxi")) return category;
                    break;
                case ENTERTAINMENT:
                    if (containsAny(msg, "entertainment", "movie", "games", "fun")) return category;
                    break;
                case GROCERIES:
                    if (containsAny(msg, "grocery", "groceries", "supermarket")) return category;
                    break;
            }
        }
        return null;
    }
    
    // Detect subjective questions or statements that need contextual AI analysis
    private boolean isSubjectiveOrContextualQuestion(String msg, String originalMessage) {
        // Specific purchase statements with opinions/questions
        if (containsAny(msg, "i spent", "i bought", "i purchased", "what do you think", "was that", "is that", "should i have")) {
            return true;
        }
        
        // Questions about value, worth, or appropriateness
        if (containsAny(msg, "worth it", "too much", "too expensive", "good deal", "bad deal", "waste", "smart", "stupid", "regret")) {
            return true;
        }
        
        // Questions about financial behavior or decisions
        if (containsAny(msg, "should i", "is it okay", "am i", "do you think", "opinion", "advice about", "thoughts on")) {
            return true;
        }
        
        // Questions about specific descriptions or patterns in spending
        if (containsAny(msg, "description", "descriptions", "why did i", "when did i", "where did i", "what did i buy")) {
            return true;
        }
        
        // Questions that require analysis beyond simple data retrieval
        if (containsAny(msg, "analyze", "pattern", "trend", "insight", "understand", "explain why", "tell me about")) {
            return true;
        }
        
        // Complex comparative or analytical questions
        if (containsAny(msg, "compared to", "different from", "similar to", "like others", "typical", "normal", "unusual")) {
            return true;
        }
        
        // Questions about financial habits or lifestyle
        if (containsAny(msg, "habit", "habits", "lifestyle", "behavior", "behaviour", "style", "way i", "how i")) {
            return true;
        }
        
        // Currency amount patterns that suggest subjective evaluation (e.g., "I spent R2000 on...")
        Pattern amountPattern = Pattern.compile("(i\\s+(spent|paid|bought)|cost\\s+me)\\s+[\\w]*\\s*\\d+", Pattern.CASE_INSENSITIVE);
        if (amountPattern.matcher(originalMessage).find()) {
            return true;
        }
        
        // Questions that can't be answered with simple database queries
        return containsAny(msg, "feel", "feeling", "worried", "concerned", "happy", "sad", "proud", "embarrassed");
    }
}
