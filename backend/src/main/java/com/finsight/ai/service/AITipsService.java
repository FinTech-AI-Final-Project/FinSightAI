package com.finsight.ai.service;

import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.Expense;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AITipsService {
    
    private static final Logger logger = LoggerFactory.getLogger(AITipsService.class);
    
    private final WebClient webClient;
    
    @Autowired
    private ExpenseService expenseService;
    
    @Autowired
    private BudgetService budgetService;
    
    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    
    @Value("${gemini.api.key}")
    private String geminiApiKey;
    
    // No rate limiting - removed all restrictions
    private final Map<String, Long> lastRequestTime = new ConcurrentHashMap<>();
    private final Map<String, List<String>> tipCache = new ConcurrentHashMap<>();
    private static final long RATE_LIMIT_MS = 0; // No rate limiting
    private static final long CACHE_DURATION_MS = 0; // No caching
    private static volatile long lastGlobalApiCall = 0;
    private static final long GLOBAL_RATE_LIMIT_MS = 0; // No global rate limiting

    public AITipsService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    // Main method to get multiple tips - returns List<String> for controller compatibility
    public List<String> getMultipleTips(User user) {
        logger.info("Getting multiple tips for user: {}", user.getFirebaseUid());
        
        try {
            // Generate base tips from user data
            List<String> baseTips = generateBaseTips(user);
            
            // Always try AI enhancement (no rate limiting)
            List<String> enhancedTips = enhanceMultipleTipsWithAI(baseTips, user);
            
            return enhancedTips;
            
        } catch (Exception e) {
            logger.error("Error generating multiple tips for user {}: {}", user.getFirebaseUid(), e.getMessage());
            
            // Return fallback tips if AI fails
            return generateFallbackTips(user);
        }
    }

    // Method for personalized single tip (controller compatibility)
    public String generatePersonalizedTip(User user) {
        logger.info("Getting personalized tip for user: {}", user.getFirebaseUid());
        
        try {
            List<String> tips = getMultipleTips(user);
            return tips.isEmpty() ? getGenericTip() : tips.get(0);
        } catch (Exception e) {
            logger.error("Error generating personalized tip for user {}: {}", user.getFirebaseUid(), e.getMessage());
            return generateFallbackTips(user).get(0);
        }
    }

    // Generate base tips from user data
    private List<String> generateBaseTips(User user) {
        List<String> tips = new ArrayList<>();
        String firstName = user.getFirstName() != null ? user.getFirstName() : "there";
        String region = getCurrencyLocation(user.getCurrency());
        
        // Get user's actual financial data
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        
        List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
        List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
        Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
        
        // Analyze spending behavior and generate personalized tips
        List<String> allTips = new ArrayList<>();
        allTips.addAll(generateSpendingAnalysisTips(firstName, region, user.getCurrency(), currentMonthExpenses, categorySpending));
        allTips.addAll(generateBudgetAnalysisTips(firstName, region, user.getCurrency(), currentMonthBudgets, categorySpending));
        allTips.addAll(generateRegionalFinancialTips(firstName, region, user.getCurrency()));
        allTips.addAll(generateGeneralSavingsTips(firstName));
        
        // Randomize the tips selection
        Collections.shuffle(allTips);
        
        // Ensure we have at least 3 tips
        while (allTips.size() < 3) {
            allTips.add(String.format("💡 %s, keep tracking your expenses in %s to build better financial habits!", firstName, user.getCurrency()));
            allTips.add(String.format("🎯 %s, set a budget for your biggest spending category and watch your savings grow!", firstName));
            allTips.add(String.format("📊 %s, review your expenses weekly to spot spending patterns and save more money!", firstName));
        }
        
        // Return up to 5 randomly selected tips
        return allTips.subList(0, Math.min(allTips.size(), 5));
    }
    
    private List<String> generateSpendingAnalysisTips(String firstName, String region, String currency, 
                                                    List<Expense> expenses, Map<ExpenseCategory, BigDecimal> categorySpending) {
        List<String> tips = new ArrayList<>();
        
        if (expenses.isEmpty()) {
            tips.add(String.format("� %s, start by setting budgets for essential categories like groceries, transport, and utilities to take control of your finances!", firstName));
            tips.add(String.format("💡 Try the 50/30/20 rule: 50%% needs, 30%% wants, 20%% savings. Set your first budget now!"));
            return tips;
        }
        
        // Calculate total spending
        BigDecimal totalSpent = expenses.stream()
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Find top spending category for targeted advice
        Optional<Map.Entry<ExpenseCategory, BigDecimal>> topCategory = categorySpending.entrySet().stream()
            .max(Map.Entry.comparingByValue());
        
        if (topCategory.isPresent()) {
            ExpenseCategory category = topCategory.get().getKey();
            BigDecimal amount = topCategory.get().getValue();
            double percentage = amount.divide(totalSpent, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
            
            // Generate actionable saving tips based on highest spending category
            if (percentage > 40) {
                tips.add(String.format("⚠️ %s, %s accounts for %.0f%% of your spending (%s %.2f). %s", 
                    firstName, category.getDisplayName(), percentage, currency, amount, 
                    getSavingsAdviceForCategory(category, region)));
            } else if (percentage > 25) {
                tips.add(String.format("💡 %s, focus on optimizing your %s spending (%s %.2f). %s", 
                    firstName, category.getDisplayName().toLowerCase(), currency, amount, 
                    getSavingsAdviceForCategory(category, region)));
            } else {
                tips.add(String.format("✅ %s, good balance! Your highest category (%s) is %.0f%% of spending. %s", 
                    firstName, category.getDisplayName().toLowerCase(), percentage,
                    getOptimizationAdviceForCategory(category, region)));
            }
        }
        
        // Frequency-based savings advice
        if (expenses.size() > 20) {
            tips.add(String.format("� %s, you made %d transactions this month. Consider bulk buying and meal planning to reduce shopping frequency and save money!", 
                firstName, expenses.size()));
        } else if (expenses.size() < 5) {
            tips.add(String.format("📝 %s, track smaller daily expenses too! Small purchases add up - try recording everything to spot savings opportunities.", firstName));
        }
        
        // Recent spending pattern analysis for actionable advice
        if (expenses.size() >= 3) {
            List<Expense> recentExpenses = expenses.stream()
                .sorted((e1, e2) -> e2.getDate().compareTo(e1.getDate()))
                .limit(3)
                .collect(Collectors.toList());
            
            BigDecimal recentTotal = recentExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal avgRecent = recentTotal.divide(BigDecimal.valueOf(3), 2, BigDecimal.ROUND_HALF_UP);
            
            if (avgRecent.compareTo(BigDecimal.valueOf(100)) > 0) { // Adjust threshold based on currency
                tips.add(String.format("⚡ %s, your recent spending is high (%s %.2f average). Try the 24-hour rule: wait a day before purchases over %s 50!", 
                    firstName, currency, avgRecent, currency));
            } else {
                tips.add(String.format("👍 %s, good recent spending control! Keep it up and consider investing your savings for compound growth!", firstName));
            }
        }
        
        return tips;
    }
    
    private List<String> generateBudgetAnalysisTips(String firstName, String region, String currency, 
                                                  List<Budget> budgets, Map<ExpenseCategory, BigDecimal> categorySpending) {
        List<String> tips = new ArrayList<>();
        
        if (budgets.isEmpty()) {
            tips.add(String.format("🎯 %s, start building wealth by setting budgets! Try the 50/30/20 rule: 50%% needs, 30%% wants, 20%% savings.", firstName));
            tips.add(String.format("💡 Set your first budget for your biggest expense category and watch your savings grow!"));
            return tips;
        }
        
        // Count budget performance for summary
        int overBudget = 0;
        int onTrack = 0;
        int underBudget = 0;
        BigDecimal totalSavings = BigDecimal.ZERO;
        
        // Analyze budget performance with focus on savings opportunities
        for (Budget budget : budgets) {
            BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            BigDecimal remaining = budget.getMonthlyLimit().subtract(spent);
            BigDecimal percentage = spent.divide(budget.getMonthlyLimit(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            
            if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
                overBudget++;
                // Over budget - urgent savings advice
                tips.add(String.format("🚨 %s, you're %.0f%% over budget for %s! %s", 
                    firstName, percentage, budget.getCategory().getDisplayName().toLowerCase(),
                    getOverBudgetSavingsAdvice(budget.getCategory(), region)));
            } else if (percentage.compareTo(BigDecimal.valueOf(90)) > 0) {
                onTrack++;
                // Close to budget limit - warning advice
                tips.add(String.format("⚠️ %s, you're at %.0f%% of your %s budget (%s %.2f left). %s", 
                    firstName, percentage, budget.getCategory().getDisplayName().toLowerCase(),
                    currency, remaining, getBudgetWarningAdviceForRegion(budget.getCategory(), region)));
            } else if (percentage.compareTo(BigDecimal.valueOf(70)) < 0) {
                underBudget++;
                totalSavings = totalSavings.add(remaining);
                // Well under budget - investment/savings advice
                tips.add(String.format("🌟 Excellent %s! You saved %s %.2f in %s this month. %s", 
                    firstName, currency, remaining, budget.getCategory().getDisplayName().toLowerCase(),
                    getSavingsInvestmentAdvice(budget.getCategory(), region, remaining, currency)));
            }
        }
        
        // Add overall budget performance summary with actionable advice
        if (overBudget > underBudget) {
            tips.add(String.format("💪 %s, focus on the categories where you're overspending. Small changes can lead to big savings!", firstName));
        } else if (underBudget > 0) {
            tips.add(String.format("🎉 %s, you're saving %s %.2f across categories! Consider investing this for long-term wealth building.", 
                firstName, currency, totalSavings));
        }
        
        return tips;
    }
    
    private List<String> generateRegionalFinancialTips(String firstName, String region, String currency) {
        List<String> tips = new ArrayList<>();
        
        switch (currency.toUpperCase()) {
            case "ZAR":
                tips.add(String.format("💰 %s, start an emergency fund with 3-6 months expenses. Use FNB or Capitec savings accounts for easy access!", firstName));
                tips.add(String.format("🎯 %s, use TFSA for tax-free growth - invest R3,000 monthly in Satrix or Ashburton ETFs!", firstName));
                tips.add(String.format("� %s, save bank fees using TymeBank or Bank Zero - those monthly fees add up to thousands yearly!", firstName));
                break;
            case "USD":
                tips.add(String.format("🎯 %s, build wealth by maxing your 401(k) match - that's free money from your employer!", firstName));
                tips.add(String.format("💡 %s, invest in low-cost index funds (VTI, VOO) for 7-10%% annual returns long-term!", firstName));
                tips.add(String.format("🏦 %s, use high-yield savings accounts (Ally, Marcus) for emergency funds - earn 4-5%% vs 0.01%% at big banks!", firstName));
                break;
            case "EUR":
                tips.add(String.format("� %s, maximize your pension contributions for tax savings and long-term wealth building!", firstName));
                tips.add(String.format("💡 %s, invest in UCITS ETFs for diversified European growth - consider VWCE or IWDA!", firstName));
                tips.add(String.format("🏦 %s, use online banks like N26 or Revolut to save on fees and get better exchange rates!", firstName));
                break;
            case "GBP":
                tips.add(String.format("� %s, maximize your ISA allowance (£20,000/year) - use Stocks & Shares ISA for growth!", firstName));
                tips.add(String.format("💡 %s, invest in FTSE Global All Cap or S&P 500 index funds for long-term wealth!", firstName));
                tips.add(String.format("🏦 %s, use Monzo or Starling for budgeting tools and fee-free spending abroad!", firstName));
                break;
            default:
                tips.add(String.format("� %s, start building wealth: 1) Emergency fund, 2) Pay off debt, 3) Invest in index funds!", firstName));
                tips.add(String.format("🎯 %s, save at least 20%% of income - automate transfers to make saving effortless!", firstName));
                tips.add(String.format("📱 %s, use budgeting apps to track spending and find areas to save more money!", firstName));
        }
        
        return tips;
    }

    private List<String> generateGeneralSavingsTips(String firstName) {
        List<String> tips = Arrays.asList(
            String.format("💰 %s, pay yourself first - save before spending on anything else!", firstName),
            String.format("🎯 %s, use the 50/30/20 rule: 50%% needs, 30%% wants, 20%% savings!", firstName),
            String.format("⚡ %s, automate your savings - set up automatic transfers to build wealth effortlessly!", firstName),
            String.format("🛡️ %s, build an emergency fund of 3-6 months expenses for financial security!", firstName),
            String.format("📈 %s, start investing early - time is your greatest wealth-building asset!", firstName),
            String.format("🍽️ %s, meal prep to save money - cooking at home saves thousands per year!", firstName),
            String.format("🚗 %s, consider public transport or cycling to reduce transportation costs!", firstName),
            String.format("💡 %s, review subscriptions monthly - cancel what you don't actively use!", firstName),
            String.format("🏦 %s, switch to a high-yield savings account to earn more on your money!", firstName),
            String.format("📱 %s, use cashback and rewards credit cards responsibly for free money!", firstName),
            String.format("🛍️ %s, implement the 24-hour rule for non-essential purchases!", firstName),
            String.format("📚 %s, invest in yourself - education and skills pay the best dividends!", firstName)
        );
        
        Collections.shuffle(tips);
        return tips;
    }

    // AI Enhancement Methods - no rate limiting
    private List<String> enhanceMultipleTipsWithAI(List<String> baseTips, User user) {
        try {
            // Get user's financial context for AI enhancement
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
            
            StringBuilder contextPrompt = new StringBuilder();
            contextPrompt.append("Create personalized financial tips for ").append(user.getFirstName())
                    .append(", a user in ").append(getCurrencyLocation(user.getCurrency()))
                    .append(" using ").append(user.getCurrency()).append(" currency.\n\n");
            
            // Add user's financial context
            contextPrompt.append("USER FINANCIAL CONTEXT:\n");
            contextPrompt.append("- Location: ").append(getCurrencyLocation(user.getCurrency())).append("\n");
            contextPrompt.append("- Currency: ").append(user.getCurrency()).append("\n");
            contextPrompt.append("- Current month expenses: ").append(currentMonthExpenses.size()).append(" transactions\n");
            
            if (!currentMonthExpenses.isEmpty()) {
                BigDecimal totalSpent = currentMonthExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                contextPrompt.append("- Total spent this month: ").append(user.getCurrency()).append(" ").append(totalSpent).append("\n");
                
                // Top spending categories
                if (!categorySpending.isEmpty()) {
                    contextPrompt.append("- Top spending categories: ");
                    categorySpending.entrySet().stream()
                        .sorted(Map.Entry.<ExpenseCategory, BigDecimal>comparingByValue().reversed())
                        .limit(3)
                        .forEach(entry -> contextPrompt.append(entry.getKey().name()).append(" (")
                            .append(user.getCurrency()).append(" ").append(entry.getValue()).append("), "));
                    contextPrompt.append("\n");
                }
            }
            
            if (!currentMonthBudgets.isEmpty()) {
                contextPrompt.append("- Active budgets: ").append(currentMonthBudgets.size()).append(" categories\n");
                for (Budget budget : currentMonthBudgets) {
                    BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
                    BigDecimal percentage = budget.getMonthlyLimit().compareTo(BigDecimal.ZERO) > 0 
                        ? spent.divide(budget.getMonthlyLimit(), 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100))
                        : BigDecimal.ZERO;
                    contextPrompt.append("  * ").append(budget.getCategory().name()).append(": ")
                        .append(spent).append("/").append(budget.getMonthlyLimit()).append(" ")
                        .append(user.getCurrency()).append(" (").append(percentage.intValue()).append("%)\n");
                }
            }
            
            contextPrompt.append("\nREQUIREMENTS:\n");
            contextPrompt.append("- Make tips specific to ").append(getCurrencyLocation(user.getCurrency())).append(" financial context\n");
            contextPrompt.append("- Include local banking options, investment products, and financial services\n");
            contextPrompt.append("- Reference specific retailers, apps, or services available in the region\n");
            contextPrompt.append("- Use actual spending data to provide relevant advice\n");
            contextPrompt.append("- Keep tips concise but actionable (max 150 characters each)\n");
            contextPrompt.append("- Use appropriate emojis and friendly tone\n");
            contextPrompt.append("- Address the user by their first name\n\n");
            
            contextPrompt.append("ENHANCE THESE BASE TIPS:\n");
            for (int i = 0; i < baseTips.size(); i++) {
                contextPrompt.append("Tip ").append(i + 1).append(": ").append(baseTips.get(i)).append("\n\n");
            }
            
            contextPrompt.append("Please return exactly 3 enhanced tips in this format:\n");
            contextPrompt.append("TIP1: [enhanced tip 1]\n");
            contextPrompt.append("TIP2: [enhanced tip 2]\n");
            contextPrompt.append("TIP3: [enhanced tip 3]\n");
            
            String enhancedContent = callGeminiAPI(contextPrompt.toString());
            
            return parseEnhancedTips(enhancedContent, baseTips);
            
        } catch (Exception e) {
            logger.warn("Failed to enhance tips with AI for user {}: {}", user.getFirebaseUid(), e.getMessage());
            return baseTips.subList(0, Math.min(baseTips.size(), 3)); // Return first 3 original tips if AI enhancement fails
        }
    }

    // Parse the AI response into individual tips
    private List<String> parseEnhancedTips(String enhancedContent, List<String> fallbackTips) {
        List<String> parsedTips = new ArrayList<>();
        
        if (enhancedContent != null && enhancedContent.contains("TIP1:")) {
            String[] lines = enhancedContent.split("\n");
            
            for (String line : lines) {
                if (line.trim().startsWith("TIP") && line.contains(":")) {
                    String tip = line.substring(line.indexOf(":") + 1).trim();
                    if (!tip.isEmpty()) {
                        parsedTips.add(tip);
                    }
                }
            }
        }
        
        // If parsing failed or didn't get enough tips, fill with fallbacks
        while (parsedTips.size() < 3) {
            int index = parsedTips.size();
            if (index < fallbackTips.size()) {
                parsedTips.add(fallbackTips.get(index));
            } else {
                parsedTips.add("💡 Keep tracking your expenses to get more personalized insights!");
            }
        }
        
        return parsedTips.subList(0, 3); // Return exactly 3 tips
    }

    // Call Gemini API with no rate limiting
    private String callGeminiAPI(String prompt) {
        try {
            // Build request body for Gemini API
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", Arrays.asList(part));
            
            requestBody.put("contents", Arrays.asList(content));
            
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 500);
            generationConfig.put("topP", 0.9);
            requestBody.put("generationConfig", generationConfig);

            logger.info("Making Gemini API call with no rate limit");
            
            Mono<Map> response = webClient.post()
                .uri(geminiApiUrl + "?key=" + geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> {
                    return clientResponse.bodyToMono(String.class)
                        .doOnNext(errorBody -> logger.error("Gemini API 4xx error: {} - {}", 
                            clientResponse.statusCode(), errorBody))
                        .then(Mono.error(new RuntimeException("API Rate Limit Error: " + clientResponse.statusCode())));
                })
                .onStatus(HttpStatusCode::is5xxServerError, serverResponse -> {
                    return Mono.error(new RuntimeException("Gemini API Server Error: " + serverResponse.statusCode()));
                })
                .bodyToMono(Map.class);

            Map<String, Object> result = response.block();
            
            if (result != null && result.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) result.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    if (candidate.containsKey("content")) {
                        Map<String, Object> content1 = (Map<String, Object>) candidate.get("content");
                        if (content1.containsKey("parts")) {
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) content1.get("parts");
                            if (!parts.isEmpty() && parts.get(0).containsKey("text")) {
                                logger.info("Gemini API call successful - AI enhancement applied");
                                return (String) parts.get(0).get("text");
                            }
                        }
                    }
                }
            }
            
            logger.warn("Gemini API returned unexpected response format");
            
        } catch (Exception e) {
            logger.error("Gemini API error: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            if (e.getCause() != null) {
                logger.error("Caused by: {}", e.getCause().getMessage());
            }
        }
        
        logger.warn("AI enhancement failed - using fallback content");
        return null;
    }

    // Generate fallback tips when AI fails
    private List<String> generateFallbackTips(User user) {
        List<String> fallbackTips = new ArrayList<>();
        String userName = user.getFirstName() != null ? user.getFirstName() : "there";
        String region = getCurrencyLocation(user.getCurrency());
        
        // Get some basic financial data for fallback tips
        try {
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            
            if (currentMonthExpenses.isEmpty()) {
                fallbackTips.add(String.format("🌟 Hey %s! Start tracking your %s expenses to get personalized insights for %s.", 
                    userName, user.getCurrency(), region));
            } else {
                BigDecimal totalSpent = currentMonthExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                fallbackTips.add(String.format("💰 %s, you've spent %s %.2f across %d transactions this month in %s.", 
                    userName, user.getCurrency(), totalSpent, currentMonthExpenses.size(), region));
            }
            
            if (currentMonthBudgets.isEmpty()) {
                fallbackTips.add(String.format("🎯 %s, setting up budgets helps you stay on track with your financial goals in %s.", 
                    userName, region));
            } else {
                fallbackTips.add(String.format("📊 %s, you have %d active budgets this month. Keep monitoring your spending in %s!", 
                    userName, currentMonthBudgets.size(), region));
            }
            
        } catch (Exception e) {
            logger.warn("Error generating data-driven fallback tips: {}", e.getMessage());
            // Basic fallback tips
            fallbackTips.add(String.format("💰 Hey %s! Start tracking your %s expenses to build better financial awareness.", userName, user.getCurrency()));
            fallbackTips.add(String.format("🎯 %s, setting up budgets for your main categories helps you stay on track in %s.", userName, region));
        }
        
        // Always add a regional tip
        if ("South Africa".equals(region)) {
            fallbackTips.add(String.format("🇿🇦 %s, consider exploring South African investment options like unit trusts, ETFs, or tax-free savings accounts!", userName));
        } else {
            fallbackTips.add(String.format("📈 %s, explore local investment and savings options available in %s for long-term wealth building.", userName, region));
        }
        
        return fallbackTips.subList(0, Math.min(fallbackTips.size(), 3));
    }

    // Legacy methods for backward compatibility
    public String getDailyTip() {
        return "💡 Track your expenses daily to build better financial habits!";
    }

    public String getDailyTip(String currency) {
        return "💡 Track your expenses daily to build better financial habits!";
    }

    public String getGenericTip() {
        return "💡 Welcome to FinSight AI! Start tracking your expenses to get personalized financial insights.";
    }

    // Helper methods
    private String formatCurrencyForUser(BigDecimal amount, User user) {
        return user.getCurrency() + " " + amount.setScale(2, BigDecimal.ROUND_HALF_UP).toString();
    }

    private String getCurrencyLocation(String currency) {
        return switch (currency.toUpperCase()) {
            case "ZAR" -> "South Africa";
            case "USD" -> "United States";
            case "EUR" -> "Europe";
            case "GBP" -> "United Kingdom";
            default -> "your region";
        };
    }
    
    private String getRegionalAdviceForCategory(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Consider shopping at Checkers, Pick n Pay, or Woolworths for better deals.";
                case FOOD_DINING -> "Try local restaurants and use apps like Zomato or Mr D Food for discounts.";
                case TRANSPORTATION -> "Explore MyCiTi bus, Gautrain, or Uber for cost-effective transport in SA.";
                case SHOPPING -> "Check out Canal Walk, Mall of Africa, or online stores like Takealot.";
                case ENTERTAINMENT -> "Visit local cinemas, theaters, or enjoy free outdoor activities.";
                case BILLS_UTILITIES -> "Consider solar panels or load-shedding solutions to reduce electricity costs.";
                case HEALTHCARE -> "Maximize your medical aid benefits and consider Dis-Chem or Clicks for savings.";
                case EDUCATION -> "Look into bursaries, NSFAS funding, or online learning platforms.";
                case TRAVEL -> "Use domestic airlines like FlySafair or road trips within SA.";
                case PERSONAL_CARE -> "Shop at Dis-Chem, Clicks, or local salons for better rates.";
                case BUSINESS -> "Consider co-working spaces in Cape Town or Johannesburg.";
                case GIFTS_DONATIONS -> "Support local charities or buy from South African artisans.";
                case INVESTMENTS -> "Look into JSE-listed stocks, unit trusts, or retirement annuities.";
                case OTHER -> "Look for local deals and compare prices across South African retailers.";
            };
        } else if ("United States".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Try Costco, Walmart, or Aldi for bulk buying and better grocery deals.";
                case FOOD_DINING -> "Use apps like Uber Eats, DoorDash, or look for restaurant happy hours.";
                case TRANSPORTATION -> "Consider public transit, carpooling, or gas rewards credit cards.";
                case SHOPPING -> "Take advantage of Amazon Prime, Target deals, or outlet malls.";
                case ENTERTAINMENT -> "Use apps like Groupon or check for happy hour specials and free events.";
                case BILLS_UTILITIES -> "Look into energy-efficient appliances and programmable thermostats.";
                case HEALTHCARE -> "Maximize your HSA contributions and compare prescription prices.";
                case EDUCATION -> "Research federal aid, scholarships, or community college options.";
                case TRAVEL -> "Use travel rewards credit cards or book flights in advance.";
                case PERSONAL_CARE -> "Try drugstore brands or shop during sales at CVS, Walgreens.";
                case BUSINESS -> "Consider co-working spaces or home office tax deductions.";
                case GIFTS_DONATIONS -> "Shop during sales seasons and research tax-deductible donations.";
                case INVESTMENTS -> "Look into index funds, 401k matching, or robo-advisors.";
                case OTHER -> "Use cashback credit cards and price comparison apps for better deals.";
            };
        } else if ("Europe".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Shop at discount stores like Lidl, Aldi, or local markets for savings.";
                case FOOD_DINING -> "Take advantage of lunch menus, local bistros, or food delivery apps.";
                case TRANSPORTATION -> "Take advantage of excellent public transport and bike-sharing programs.";
                case SHOPPING -> "Look for VAT-free shopping, outlet villages, or local markets.";
                case ENTERTAINMENT -> "Look for student discounts, cultural passes, and free museum days.";
                case BILLS_UTILITIES -> "Consider green energy providers and energy-saving EU appliances.";
                case HEALTHCARE -> "Understand your national health coverage and supplementary insurance options.";
                case EDUCATION -> "Research Erasmus programs, EU student benefits, or online courses.";
                case TRAVEL -> "Use budget airlines like Ryanair, or train passes for multiple countries.";
                case PERSONAL_CARE -> "Try local pharmacies or drugstore chains for better prices.";
                case BUSINESS -> "Look into EU business grants or co-working spaces in major cities.";
                case GIFTS_DONATIONS -> "Support local artisans or contribute to EU-wide charitable causes.";
                case INVESTMENTS -> "Consider UCITS funds, ETFs, or government savings schemes.";
                case OTHER -> "Compare prices across EU countries when making larger purchases.";
            };
        } else if ("United Kingdom".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Try Tesco Clubcard, Sainsbury's Nectar, or Aldi for grocery savings.";
                case FOOD_DINING -> "Use apps like Deliveroo, Just Eat, or look for pub meal deals.";
                case TRANSPORTATION -> "Get an Oyster card, railcard, or consider cycling in cities.";
                case SHOPPING -> "Shop during sales at John Lewis, M&S, or use cashback apps.";
                case ENTERTAINMENT -> "Use apps like Tastecard or look for 2-for-1 cinema deals.";
                case BILLS_UTILITIES -> "Compare energy suppliers and consider smart meters for better rates.";
                case HEALTHCARE -> "Take advantage of NHS services and private health insurance if needed.";
                case EDUCATION -> "Look into student loans, grants, or apprenticeship programs.";
                case TRAVEL -> "Book in advance with budget airlines or use rail cards for trains.";
                case PERSONAL_CARE -> "Shop at Boots, Superdrug, or local salons for competitive prices.";
                case BUSINESS -> "Consider business rates relief or co-working spaces in London.";
                case GIFTS_DONATIONS -> "Shop during seasonal sales or support UK charities with Gift Aid.";
                case INVESTMENTS -> "Look into ISAs, pension schemes, or investment platforms like Hargreaves Lansdown.";
                case OTHER -> "Use comparison websites like MoneySuperMarket for better deals.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Compare prices at different stores and consider bulk buying for savings.";
                case FOOD_DINING -> "Look for lunch specials, happy hours, or local food delivery deals.";
                case TRANSPORTATION -> "Explore public transport options and carpooling to reduce costs.";
                case SHOPPING -> "Compare prices online, look for seasonal sales, or use cashback apps.";
                case ENTERTAINMENT -> "Look for local deals, happy hours, and free community events.";
                case BILLS_UTILITIES -> "Consider energy-efficient options and compare service providers.";
                case HEALTHCARE -> "Research insurance options and preventive care benefits.";
                case EDUCATION -> "Look into scholarships, online courses, or community programs.";
                case TRAVEL -> "Book in advance, use comparison sites, or consider off-season travel.";
                case PERSONAL_CARE -> "Shop during sales, use generic brands, or look for local deals.";
                case BUSINESS -> "Research local business resources, grants, or networking opportunities.";
                case GIFTS_DONATIONS -> "Shop during sales seasons and research charitable tax benefits.";
                case INVESTMENTS -> "Research local investment options, retirement accounts, or financial advisors.";
                case OTHER -> "Compare local options and look for seasonal deals in your area.";
            };
        }
    }
    
    private String getSpendingAdviceForRegion(String region, String currency) {
        return switch (region) {
            case "South Africa" -> "Consider using apps like SnapScan, Zapper, or 22seven for expense tracking in SA.";
            case "United States" -> "Use apps like Mint, YNAB, or Personal Capital to track your USD spending effectively.";
            case "Europe" -> "Try apps like Money Lover, Spendee, or local banking apps for EUR expense tracking.";
            case "United Kingdom" -> "Consider apps like Monzo, Starling Bank, or Emma for GBP budgeting and tracking.";
            default -> String.format("Use local budgeting apps and digital banking tools to track your %s spending effectively.", currency);
        };
    }
    
    private String getRecentSpendingAdvice(String region, String currency) {
        return switch (region) {
            case "South Africa" -> "Keep receipts for tax deductions and consider using Capitec or FNB's budgeting tools.";
            case "United States" -> "Track receipts for tax purposes and consider using bank budgeting tools or credit card rewards.";
            case "Europe" -> "Keep receipts for VAT purposes and use your bank's spending insights and budgeting features.";
            case "United Kingdom" -> "Save receipts for expenses and use your bank's spending categorization and budgeting tools.";
            default -> String.format("Review your spending patterns and look for areas to optimize in your %s budget.", currency);
        };
    }
    
    private String getBudgetingAdviceForRegion(String region, String currency) {
        return switch (region) {
            case "South Africa" -> "Start with essential categories like groceries, transport, and utilities. Use the 50/30/20 rule adapted for SA living costs.";
            case "United States" -> "Focus on housing, transportation, and food first. Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.";
            case "Europe" -> "Prioritize housing, transport, and groceries. Consider the European approach: 40% needs, 30% lifestyle, 30% savings.";
            case "United Kingdom" -> "Start with rent/mortgage, council tax, and transport. Use the UK 50/30/20 rule adapted for higher living costs.";
            default -> String.format("Focus on your biggest expense categories first when setting up %s budgets. Start with housing, food, and transport.", currency);
        };
    }
    
    private String getOverBudgetAdviceForRegion(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Try bulk buying at Makro or Cashbuild, or consider store brands at Pick n Pay.";
                case FOOD_DINING -> "Cook more at home and limit takeaways to special occasions.";
                case TRANSPORTATION -> "Look into carpooling options or monthly transport passes for savings.";
                case SHOPPING -> "Avoid impulse purchases and stick to a shopping list this month.";
                case ENTERTAINMENT -> "Explore free activities like hiking Table Mountain or visiting local markets.";
                case BILLS_UTILITIES -> "Implement energy-saving measures and consider solar geysers for long-term savings.";
                case HEALTHCARE -> "Use medical aid benefits wisely and compare pharmacy prices.";
                case EDUCATION -> "Look for free online courses or library resources instead of paid options.";
                case TRAVEL -> "Postpone non-essential trips and look for local weekend getaways.";
                case PERSONAL_CARE -> "Extend time between salon visits and use drugstore alternatives.";
                case BUSINESS -> "Review subscriptions and cut unnecessary business expenses.";
                case GIFTS_DONATIONS -> "Set a strict limit and focus on meaningful rather than expensive gifts.";
                case INVESTMENTS -> "Review your investment strategy and avoid over-investing this month.";
                case OTHER -> "Review your spending patterns and cut non-essential expenses this month.";
            };
        } else if ("United States".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Try Costco for bulk buying, use coupons, or switch to generic brands.";
                case FOOD_DINING -> "Cook at home more and use restaurant apps for discounts when dining out.";
                case TRANSPORTATION -> "Consider carpooling, public transit, or combining trips to save on gas.";
                case SHOPPING -> "Wait 24 hours before purchases and use cashback apps.";
                case ENTERTAINMENT -> "Look for free events, library programs, or happy hour specials.";
                case BILLS_UTILITIES -> "Adjust thermostat settings and unplug electronics to reduce bills.";
                case HEALTHCARE -> "Use HSA funds wisely and compare prescription prices at different pharmacies.";
                case EDUCATION -> "Look for free MOOCs or community college options instead of expensive courses.";
                case TRAVEL -> "Book in advance, use travel rewards, or consider staycations.";
                case PERSONAL_CARE -> "Use drugstore brands and extend time between professional services.";
                case BUSINESS -> "Review business subscriptions and cut unnecessary software/services.";
                case GIFTS_DONATIONS -> "Set spending limits and look for meaningful, budget-friendly gifts.";
                case INVESTMENTS -> "Don't over-invest if it impacts your emergency fund.";
                case OTHER -> "Review subscriptions and cut non-essential spending for the rest of the month.";
            };
        } else if ("Europe".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Shop at discount stores like Lidl/Aldi or buy seasonal local produce.";
                case FOOD_DINING -> "Take advantage of lunch menus and cook more meals at home.";
                case TRANSPORTATION -> "Use public transport passes or bike more to reduce transport costs.";
                case SHOPPING -> "Wait before purchases and compare prices across EU countries.";
                case ENTERTAINMENT -> "Take advantage of free cultural events and student/senior discounts.";
                case BILLS_UTILITIES -> "Use energy-efficient settings and compare energy providers.";
                case HEALTHCARE -> "Use national health services and compare private insurance options.";
                case EDUCATION -> "Look into EU education programs and free online resources.";
                case TRAVEL -> "Use budget airlines and book accommodation in advance.";
                case PERSONAL_CARE -> "Use local pharmacies and extend time between treatments.";
                case BUSINESS -> "Look into EU business grants and cut unnecessary subscriptions.";
                case GIFTS_DONATIONS -> "Support local artisans with budget-conscious purchases.";
                case INVESTMENTS -> "Review EU investment options and don't over-extend.";
                case OTHER -> "Review your spending and focus on essential purchases only this month.";
            };
        } else if ("United Kingdom".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Use supermarket own brands, shop at Aldi/Lidl, or try reduced-price sections.";
                case FOOD_DINING -> "Use apps like Tastecard and cook more meals at home.";
                case TRANSPORTATION -> "Get a railcard, use day passes, or cycle more to cut transport costs.";
                case SHOPPING -> "Use comparison sites and wait for sales before making purchases.";
                case ENTERTAINMENT -> "Look for 2-for-1 deals, free museums, or pub quiz nights.";
                case BILLS_UTILITIES -> "Compare energy suppliers and use smart meter data to reduce usage.";
                case HEALTHCARE -> "Use NHS services and compare private health insurance if needed.";
                case EDUCATION -> "Look into government funding and free online course options.";
                case TRAVEL -> "Book with budget airlines and use rail cards for cheaper train travel.";
                case PERSONAL_CARE -> "Shop at Boots/Superdrug and extend time between salon visits.";
                case BUSINESS -> "Review business expenses and cut unnecessary subscriptions.";
                case GIFTS_DONATIONS -> "Shop during sales and support UK charities with Gift Aid.";
                case INVESTMENTS -> "Use ISAs wisely and don't over-invest beyond your means.";
                case OTHER -> "Cut back on non-essentials and use comparison sites for better deals.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Look for sales, buy generic brands, or shop at discount stores.";
                case FOOD_DINING -> "Cook more at home and look for restaurant deals when dining out.";
                case TRANSPORTATION -> "Use public transport, carpool, or combine trips to save money.";
                case SHOPPING -> "Avoid impulse purchases and compare prices before buying.";
                case ENTERTAINMENT -> "Find free local activities or take advantage of happy hour deals.";
                case BILLS_UTILITIES -> "Reduce usage and compare service providers for better rates.";
                case HEALTHCARE -> "Compare insurance options and use preventive care benefits.";
                case EDUCATION -> "Look for free online courses and library resources.";
                case TRAVEL -> "Book in advance and consider off-season travel for savings.";
                case PERSONAL_CARE -> "Use generic brands and extend time between professional services.";
                case BUSINESS -> "Review business expenses and cut unnecessary subscriptions.";
                case GIFTS_DONATIONS -> "Set spending limits and look for meaningful, budget-friendly options.";
                case INVESTMENTS -> "Don't over-invest if it impacts your emergency fund.";
                case OTHER -> "Review your spending patterns and cut non-essential expenses this month.";
            };
        }
    }
    
    private String getGoodBudgetAdviceForRegion(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Great control! Consider investing the savings in a unit trust or TFSA.";
                case FOOD_DINING -> "Well done! Maybe allocate dining savings to an emergency fund.";
                case TRANSPORTATION -> "Excellent! Maybe allocate some savings to an emergency fund or investment.";
                case SHOPPING -> "Nice control! Consider investing extra funds in JSE ETFs.";
                case ENTERTAINMENT -> "Nice budgeting! Consider putting extra funds toward retirement annuities.";
                case BILLS_UTILITIES -> "Great savings! Consider investing the difference in property funds.";
                case HEALTHCARE -> "Excellent control! Maybe boost your medical aid or health savings.";
                case EDUCATION -> "Good budgeting! Consider investing in skills development or certifications.";
                case TRAVEL -> "Well managed! Maybe save for a bigger trip or invest the difference.";
                case PERSONAL_CARE -> "Great control! Consider investing savings in long-term goals.";
                case BUSINESS -> "Excellent! Maybe reinvest in business growth or save for opportunities.";
                case GIFTS_DONATIONS -> "Thoughtful budgeting! Consider long-term charitable giving strategies.";
                case INVESTMENTS -> "Good discipline! Consider diversifying your investment portfolio.";
                case OTHER -> "Keep it up! Consider investing the difference in JSE ETFs or property funds.";
            };
        } else if ("United States".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Great job! Consider putting the savings into your 401(k) or IRA.";
                case FOOD_DINING -> "Excellent control! Maybe invest dining savings in index funds.";
                case TRANSPORTATION -> "Excellent control! Maybe boost your emergency fund or invest in index funds.";
                case SHOPPING -> "Nice discipline! Consider investing the savings in S&P 500 ETFs.";
                case ENTERTAINMENT -> "Well done! Consider investing the extra in S&P 500 ETFs or savings account.";
                case BILLS_UTILITIES -> "Great savings! Consider boosting your emergency fund with the difference.";
                case HEALTHCARE -> "Good control! Maybe increase your HSA contributions.";
                case EDUCATION -> "Excellent! Consider investing in skills that boost your earning potential.";
                case TRAVEL -> "Well managed! Maybe save for a bigger vacation or invest the difference.";
                case PERSONAL_CARE -> "Great control! Consider investing savings in long-term financial goals.";
                case BUSINESS -> "Excellent! Maybe reinvest in business growth or retirement accounts.";
                case GIFTS_DONATIONS -> "Thoughtful budgeting! Consider tax-advantaged charitable giving.";
                case INVESTMENTS -> "Good discipline! Consider diversifying across different asset classes.";
                case OTHER -> "Keep it up! Consider investing the difference in low-cost index funds or bonds.";
            };
        } else if ("Europe".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Excellent! Consider investing the savings in UCITS ETFs or savings accounts.";
                case FOOD_DINING -> "Great control! Maybe invest dining savings in European index funds.";
                case TRANSPORTATION -> "Great budgeting! Maybe put extra funds toward pension contributions.";
                case SHOPPING -> "Nice discipline! Consider investing in European index funds.";
                case ENTERTAINMENT -> "Well done! Consider investing in European index funds or bonds.";
                case BILLS_UTILITIES -> "Excellent savings! Consider boosting your emergency fund.";
                case HEALTHCARE -> "Good control! Maybe invest in supplementary health insurance.";
                case EDUCATION -> "Great! Consider investing in skills development or EU programs.";
                case TRAVEL -> "Well managed! Maybe save for a bigger European trip.";
                case PERSONAL_CARE -> "Great control! Consider investing savings in long-term goals.";
                case BUSINESS -> "Excellent! Look into EU business investment opportunities.";
                case GIFTS_DONATIONS -> "Thoughtful! Consider supporting EU-wide charitable causes.";
                case INVESTMENTS -> "Good discipline! Consider diversifying across European markets.";
                case OTHER -> "Keep it up! Consider investing the difference in diversified European funds.";
            };
        } else if ("United Kingdom".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Brilliant! Consider putting the savings into your ISA or pension.";
                case FOOD_DINING -> "Excellent control! Maybe invest dining savings in your ISA.";
                case TRANSPORTATION -> "Excellent! Maybe boost your emergency fund or invest in UK index funds.";
                case SHOPPING -> "Nice discipline! Consider investing in FTSE index funds via your ISA.";
                case ENTERTAINMENT -> "Well done! Consider investing the extra in your Stocks & Shares ISA.";
                case BILLS_UTILITIES -> "Great savings! Consider boosting your emergency fund.";
                case HEALTHCARE -> "Good control! Maybe invest in private health insurance or savings.";
                case EDUCATION -> "Excellent! Consider investing in skills that boost your career.";
                case TRAVEL -> "Well managed! Maybe save for a bigger holiday or invest the difference.";
                case PERSONAL_CARE -> "Great control! Consider investing savings in your ISA.";
                case BUSINESS -> "Excellent! Maybe reinvest in business growth or pension contributions.";
                case GIFTS_DONATIONS -> "Thoughtful! Consider Gift Aid for charitable donations.";
                case INVESTMENTS -> "Good discipline! Consider diversifying across different UK investment options.";
                case OTHER -> "Keep it up! Consider investing the difference in FTSE index funds or bonds.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Great control! Consider investing the savings for long-term growth.";
                case FOOD_DINING -> "Excellent discipline! Maybe invest dining savings in index funds.";
                case TRANSPORTATION -> "Excellent! Maybe allocate some savings to an emergency fund or investments.";
                case SHOPPING -> "Nice control! Consider investing extra funds in diversified portfolios.";
                case ENTERTAINMENT -> "Nice budgeting! Consider putting extra funds toward your financial goals.";
                case BILLS_UTILITIES -> "Great savings! Consider boosting your emergency fund.";
                case HEALTHCARE -> "Good control! Maybe increase your health savings or insurance.";
                case EDUCATION -> "Excellent! Consider investing in skills that enhance your earning potential.";
                case TRAVEL -> "Well managed! Maybe save for a bigger trip or invest the difference.";
                case PERSONAL_CARE -> "Great control! Consider investing savings in long-term financial goals.";
                case BUSINESS -> "Excellent! Maybe reinvest in business growth or retirement savings.";
                case GIFTS_DONATIONS -> "Thoughtful budgeting! Consider strategic charitable giving.";
                case INVESTMENTS -> "Good discipline! Consider diversifying your investment portfolio.";
                case OTHER -> "Keep it up! Consider investing the difference for your future financial security.";
            };
        }
    }
    
    private String getBudgetWarningAdviceForRegion(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Slow down on grocery spending - consider meal planning or shopping at Shoprite.";
                case FOOD_DINING -> "Monitor dining out - consider cooking more meals at home.";
                case TRANSPORTATION -> "Monitor transport costs carefully - maybe carpool or use public transport more.";
                case SHOPPING -> "Be cautious with shopping - stick to essentials and avoid impulse buys.";
                case ENTERTAINMENT -> "Consider free weekend activities like beach visits or local parks.";
                case BILLS_UTILITIES -> "Watch utility usage - implement energy-saving measures.";
                case HEALTHCARE -> "Monitor health expenses - use medical aid benefits wisely.";
                case EDUCATION -> "Be mindful of education costs - look for free alternatives.";
                case TRAVEL -> "Watch travel spending - consider local options or postpone trips.";
                case PERSONAL_CARE -> "Monitor personal care expenses - extend time between treatments.";
                case BUSINESS -> "Review business expenses - cut non-essential subscriptions.";
                case GIFTS_DONATIONS -> "Be mindful of gift spending - set strict limits.";
                case INVESTMENTS -> "Review investment timing - don't over-invest this month.";
                case OTHER -> "Watch this category closely for the rest of the month.";
            };
        } else if ("United States".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Careful with grocery spending - try meal planning or use store brands.";
                case FOOD_DINING -> "Monitor dining expenses - cook more at home and use restaurant apps.";
                case TRANSPORTATION -> "Monitor gas/transport costs - consider carpooling or public transit.";
                case SHOPPING -> "Be cautious with purchases - wait 24 hours before buying.";
                case ENTERTAINMENT -> "Look for free activities like parks, libraries, or community events.";
                case BILLS_UTILITIES -> "Watch utility bills - adjust thermostat and unplug electronics.";
                case HEALTHCARE -> "Monitor health expenses - use HSA funds wisely.";
                case EDUCATION -> "Be mindful of education costs - look for free online courses.";
                case TRAVEL -> "Watch travel spending - book in advance or consider staycations.";
                case PERSONAL_CARE -> "Monitor personal care costs - use drugstore alternatives.";
                case BUSINESS -> "Review business expenses - cut unnecessary subscriptions.";
                case GIFTS_DONATIONS -> "Be mindful of gift spending - look for budget-friendly options.";
                case INVESTMENTS -> "Review investment strategy - don't over-extend this month.";
                case OTHER -> "Keep a close eye on this category to avoid going over budget.";
            };
        } else if ("Europe".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Be careful with grocery spending - try local markets or discount stores.";
                case FOOD_DINING -> "Monitor dining costs - take advantage of lunch menus.";
                case TRANSPORTATION -> "Monitor transport costs - use public transport passes or bike more.";
                case SHOPPING -> "Be cautious with purchases - compare prices across countries.";
                case ENTERTAINMENT -> "Look for free cultural events or take advantage of student discounts.";
                case BILLS_UTILITIES -> "Watch utility costs - use energy-efficient settings.";
                case HEALTHCARE -> "Monitor health expenses - use national health services.";
                case EDUCATION -> "Be mindful of education costs - look into EU programs.";
                case TRAVEL -> "Watch travel spending - use budget airlines and book early.";
                case PERSONAL_CARE -> "Monitor personal care costs - use local pharmacy alternatives.";
                case BUSINESS -> "Review business expenses - look into EU grants.";
                case GIFTS_DONATIONS -> "Be mindful of gift spending - support local artisans wisely.";
                case INVESTMENTS -> "Review investment strategy - don't over-extend in EU markets.";
                case OTHER -> "Watch this category carefully for the remainder of the month.";
            };
        } else if ("United Kingdom".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Careful with food spending - try meal planning or shop at budget supermarkets.";
                case FOOD_DINING -> "Monitor dining costs - use apps like Tastecard for discounts.";
                case TRANSPORTATION -> "Monitor travel costs - consider off-peak times or walking/cycling more.";
                case SHOPPING -> "Be cautious with purchases - use comparison sites before buying.";
                case ENTERTAINMENT -> "Look for 2-for-1 deals or free events like museum visits.";
                case BILLS_UTILITIES -> "Watch energy bills - compare suppliers and use smart meters.";
                case HEALTHCARE -> "Monitor health costs - use NHS services when possible.";
                case EDUCATION -> "Be mindful of education expenses - look into government funding.";
                case TRAVEL -> "Watch travel spending - use rail cards and book budget airlines.";
                case PERSONAL_CARE -> "Monitor personal care costs - shop at Boots/Superdrug sales.";
                case BUSINESS -> "Review business expenses - cut unnecessary subscriptions.";
                case GIFTS_DONATIONS -> "Be mindful of gift spending - shop during sales.";
                case INVESTMENTS -> "Review investment strategy - use ISAs wisely this month.";
                case OTHER -> "Keep an eye on this category to stay within budget.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Be mindful of food spending - try meal planning and compare prices.";
                case FOOD_DINING -> "Monitor dining expenses - cook more at home.";
                case TRANSPORTATION -> "Monitor transport costs - look for more economical travel options.";
                case SHOPPING -> "Be cautious with purchases - avoid impulse buying.";
                case ENTERTAINMENT -> "Consider free or low-cost entertainment options in your area.";
                case BILLS_UTILITIES -> "Watch utility costs - reduce usage and compare providers.";
                case HEALTHCARE -> "Monitor health expenses - use insurance benefits wisely.";
                case EDUCATION -> "Be mindful of education costs - look for free resources.";
                case TRAVEL -> "Watch travel spending - book in advance for better rates.";
                case PERSONAL_CARE -> "Monitor personal care costs - use generic brands.";
                case BUSINESS -> "Review business expenses - cut non-essential subscriptions.";
                case GIFTS_DONATIONS -> "Be mindful of gift spending - set strict budgets.";
                case INVESTMENTS -> "Review investment timing - don't over-invest this month.";
                case OTHER -> "Monitor this category carefully to avoid going over budget.";
            };
        }
    }
    
    private String getSavingsAdviceForCategory(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Try meal planning and shopping at Checkers/PnP with their loyalty cards for instant savings!";
                case FOOD_DINING -> "Cook more at home! Dining out less can save you hundreds of rands monthly.";
                case TRANSPORTATION -> "Consider MyCiTi monthly passes or carpooling to cut transport costs significantly.";
                case SHOPPING -> "Set a monthly shopping budget and stick to it. Use Takealot wishlist to avoid impulse buying.";
                case ENTERTAINMENT -> "Look for free activities like hiking Table Mountain or visiting beaches instead of paid entertainment.";
                case BILLS_UTILITIES -> "Switch to energy-saving bulbs and consider solar solutions to reduce electricity bills long-term.";
                case HEALTHCARE -> "Use your medical aid benefits fully and shop around at Dis-Chem vs Clicks for better medicine prices.";
                case EDUCATION -> "Look into free online courses or library resources before paying for expensive training.";
                case TRAVEL -> "Travel during off-peak times and book FlySafair early for domestic trips to save money.";
                case PERSONAL_CARE -> "Extend time between salon visits and use drugstore alternatives to reduce beauty costs.";
                case BUSINESS -> "Review all business subscriptions - cancel unused services and negotiate better rates.";
                case GIFTS_DONATIONS -> "Set a strict monthly gift budget and stick to meaningful rather than expensive presents.";
                case INVESTMENTS -> "Great! But ensure you have 3-6 months emergency fund before investing more.";
                case OTHER -> "Review and categorize these expenses properly to identify where you can cut back and save.";
            };
        } else if ("United States".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Use store brands, coupons, and shop at Costco/Walmart for bulk savings!";
                case FOOD_DINING -> "Cook at home more! Meal prep on Sundays to avoid expensive takeout during the week.";
                case TRANSPORTATION -> "Carpool, use public transit, or combine trips to significantly reduce gas expenses.";
                case SHOPPING -> "Use the 24-hour rule: wait a day before non-essential purchases to avoid impulse buying.";
                case ENTERTAINMENT -> "Take advantage of free parks, libraries, and community events instead of paid activities.";
                case BILLS_UTILITIES -> "Adjust your thermostat 2-3 degrees and unplug electronics to lower monthly bills.";
                case HEALTHCARE -> "Maximize your HSA contributions and compare prescription prices at different pharmacies.";
                case EDUCATION -> "Look into free MOOCs or community college courses before expensive private training.";
                case TRAVEL -> "Use travel rewards credit cards and book flights well in advance for better rates.";
                case PERSONAL_CARE -> "Use drugstore brands and extend time between professional services to save money.";
                case BUSINESS -> "Review all subscriptions monthly - cancel unused software and negotiate better rates.";
                case GIFTS_DONATIONS -> "Set spending limits and focus on thoughtful, budget-friendly gift options.";
                case INVESTMENTS -> "Excellent! Ensure you're maxing out employer 401k match before other investments.";
                case OTHER -> "Track these expenses properly to identify patterns and potential savings opportunities.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Plan meals weekly, buy generic brands, and shop with a list to avoid overspending!";
                case FOOD_DINING -> "Cook more meals at home - it's one of the biggest money-saving opportunities!";
                case TRANSPORTATION -> "Use public transport, walk, or bike more to reduce transport costs significantly.";
                case SHOPPING -> "Implement a 48-hour waiting period for non-essential purchases to reduce impulse buying.";
                case ENTERTAINMENT -> "Find free local activities and community events instead of expensive entertainment.";
                case BILLS_UTILITIES -> "Reduce energy usage and compare service providers for potential savings.";
                case HEALTHCARE -> "Use preventive care benefits and compare prices for medications and services.";
                case EDUCATION -> "Look for free online resources and library programs before paying for courses.";
                case TRAVEL -> "Book in advance, travel off-season, and compare prices across different booking sites.";
                case PERSONAL_CARE -> "Extend time between treatments and use budget-friendly alternatives when possible.";
                case BUSINESS -> "Review all business expenses monthly and eliminate non-essential subscriptions.";
                case GIFTS_DONATIONS -> "Set strict budgets for gifts and focus on meaningful rather than expensive options.";
                case INVESTMENTS -> "Great habit! Ensure emergency fund is adequate before increasing investment amounts.";
                case OTHER -> "Categorize these expenses properly to identify where you can optimize and save money.";
            };
        }
    }
    
    private String getOptimizationAdviceForCategory(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Consider investing grocery savings in a TFSA or unit trust for long-term growth.";
                case FOOD_DINING -> "Since dining is controlled, maybe allocate some funds to building an emergency fund.";
                case TRANSPORTATION -> "Good transport budgeting! Consider investing the savings in JSE ETFs.";
                case SHOPPING -> "Well controlled shopping! Put the difference towards your retirement annuity.";
                case ENTERTAINMENT -> "Great balance! Consider saving this amount monthly for a bigger goal.";
                case BILLS_UTILITIES -> "Efficient utility usage! Invest the savings in long-term wealth building.";
                case HEALTHCARE -> "Good health spending control! Build up your emergency medical fund.";
                case EDUCATION -> "Smart education budgeting! Keep investing in skills that increase earning potential.";
                case TRAVEL -> "Good travel budgeting! Save consistently for bigger trips or investments.";
                case PERSONAL_CARE -> "Well managed! Consider putting beauty savings towards financial goals.";
                case BUSINESS -> "Efficient business spending! Reinvest savings into business growth opportunities.";
                case GIFTS_DONATIONS -> "Thoughtful giving approach! Consider regular charitable giving strategies.";
                case INVESTMENTS -> "Excellent investment discipline! Consider diversifying your portfolio further.";
                case OTHER -> "Keep this category low and redirect any savings to your financial goals.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Good grocery control! Consider investing the savings for long-term wealth building.";
                case FOOD_DINING -> "Nice balance! Maybe allocate dining savings to your emergency fund.";
                case TRANSPORTATION -> "Efficient transport spending! Put the savings towards your financial goals.";
                case SHOPPING -> "Good shopping discipline! Invest the difference in index funds or savings.";
                case ENTERTAINMENT -> "Great balance! Save this amount monthly towards a bigger financial goal.";
                case BILLS_UTILITIES -> "Efficient utility management! Invest the savings for your future.";
                case HEALTHCARE -> "Good health spending balance! Build up your health emergency fund.";
                case EDUCATION -> "Smart education investment! Keep building skills that boost earning potential.";
                case TRAVEL -> "Good travel budgeting! Save consistently for bigger trips or investments.";
                case PERSONAL_CARE -> "Well managed! Consider investing personal care savings in financial goals.";
                case BUSINESS -> "Efficient business spending! Reinvest savings into growth opportunities.";
                case GIFTS_DONATIONS -> "Thoughtful giving! Consider systematic charitable giving strategies.";
                case INVESTMENTS -> "Excellent discipline! Consider diversifying your investment approach.";
                case OTHER -> "Keep this category minimal and redirect savings to your primary financial goals.";
            };
        }
    }
    
    private String getOverBudgetSavingsAdvice(ExpenseCategory category, String region) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> "Cut grocery costs: meal plan, use Checkers/PnP specials, and avoid branded items. You can save 20-30%!";
                case FOOD_DINING -> "Reduce takeaways immediately! Cook at home to save hundreds monthly.";
                case TRANSPORTATION -> "Switch to public transport or carpool this month to get back on track.";
                case SHOPPING -> "Implement a strict no-shopping rule for non-essentials this month.";
                case ENTERTAINMENT -> "Skip paid entertainment - enjoy free beaches, hiking, and parks instead.";
                case BILLS_UTILITIES -> "Reduce electricity usage immediately - unplug devices and use less heating/cooling.";
                case HEALTHCARE -> "Stick to generic medications and use medical aid benefits more efficiently.";
                case EDUCATION -> "Pause paid courses and use free online resources until back on budget.";
                case TRAVEL -> "Cancel non-essential trips and stick to local activities this month.";
                case PERSONAL_CARE -> "Delay salon visits and use drugstore alternatives to reduce costs.";
                case BUSINESS -> "Cut all non-essential business subscriptions immediately.";
                case GIFTS_DONATIONS -> "Set a strict R200 limit for gifts and donations this month.";
                case INVESTMENTS -> "Reduce investment amounts until you're back within budget.";
                case OTHER -> "Identify and eliminate these mystery expenses immediately.";
            };
        } else {
            return switch (category) {
                case GROCERIES -> "Cut grocery costs: meal plan, buy generic brands, and shop with a strict list. Aim to save 25%!";
                case FOOD_DINING -> "Stop dining out immediately! Cook all meals at home this month.";
                case TRANSPORTATION -> "Use public transport, carpool, or combine trips to cut costs now.";
                case SHOPPING -> "Implement a spending freeze on all non-essential purchases.";
                case ENTERTAINMENT -> "Stick to free activities only - parks, libraries, and community events.";
                case BILLS_UTILITIES -> "Reduce utility usage immediately - adjust thermostat and unplug devices.";
                case HEALTHCARE -> "Use generic medications and maximize insurance benefits.";
                case EDUCATION -> "Pause paid courses and use free resources until budget is back on track.";
                case TRAVEL -> "Cancel discretionary travel and stick to local activities.";
                case PERSONAL_CARE -> "Delay professional services and use budget alternatives.";
                case BUSINESS -> "Cut all non-essential business expenses immediately.";
                case GIFTS_DONATIONS -> "Set strict spending limits for gifts until back on budget.";
                case INVESTMENTS -> "Reduce investment contributions until spending is controlled.";
                case OTHER -> "Track and eliminate these unbudgeted expenses immediately.";
            };
        }
    }
    
    private String getSavingsInvestmentAdvice(ExpenseCategory category, String region, BigDecimal savings, String currency) {
        if ("South Africa".equals(region)) {
            return switch (category) {
                case GROCERIES -> String.format("Consider investing this %s %.2f monthly in a TFSA or unit trust for tax-free growth!", currency, savings);
                case FOOD_DINING -> String.format("Put this %s %.2f into your emergency fund - aim for 3-6 months of expenses!", currency, savings);
                case TRANSPORTATION -> String.format("Invest this %s %.2f in JSE ETFs through EasyEquities for long-term wealth!", currency, savings);
                case SHOPPING -> String.format("Channel this %s %.2f into a retirement annuity - your future self will thank you!", currency, savings);
                case ENTERTAINMENT -> String.format("Save this %s %.2f for a bigger goal - maybe a house deposit or investment!", currency, savings);
                case BILLS_UTILITIES -> String.format("Invest this %s %.2f in property funds or REITs for passive income!", currency, savings);
                case HEALTHCARE -> String.format("Build a medical emergency fund with this %s %.2f monthly!", currency, savings);
                case EDUCATION -> String.format("Invest this %s %.2f in skills development that can boost your income!", currency, savings);
                case TRAVEL -> String.format("Save this %s %.2f monthly for that dream vacation or invest for bigger returns!", currency, savings);
                case PERSONAL_CARE -> String.format("Put this %s %.2f towards your financial goals - every rand counts!", currency, savings);
                case BUSINESS -> String.format("Reinvest this %s %.2f in business growth or put it in high-yield investments!", currency, savings);
                case GIFTS_DONATIONS -> String.format("Consider investing this %s %.2f to create more wealth for future giving!", currency, savings);
                case INVESTMENTS -> String.format("Great discipline! Consider diversifying this %s %.2f across different assets!", currency, savings);
                case OTHER -> String.format("Direct this %s %.2f towards your top financial priority - emergency fund or investments!", currency, savings);
            };
        } else {
            return switch (category) {
                case GROCERIES -> String.format("Invest this %s %.2f monthly in index funds for steady wealth building!", currency, savings);
                case FOOD_DINING -> String.format("Add this %s %.2f to your emergency fund - financial security first!", currency, savings);
                case TRANSPORTATION -> String.format("Put this %s %.2f into investment accounts for long-term growth!", currency, savings);
                case SHOPPING -> String.format("Channel this %s %.2f into retirement savings - compound interest is powerful!", currency, savings);
                case ENTERTAINMENT -> String.format("Save this %s %.2f for bigger financial goals or investment opportunities!", currency, savings);
                case BILLS_UTILITIES -> String.format("Invest this %s %.2f in dividend stocks or bonds for passive income!", currency, savings);
                case HEALTHCARE -> String.format("Build a health emergency fund with this %s %.2f monthly!", currency, savings);
                case EDUCATION -> String.format("Invest this %s %.2f in skills that can increase your earning potential!", currency, savings);
                case TRAVEL -> String.format("Save this %s %.2f for future adventures or invest for compound growth!", currency, savings);
                case PERSONAL_CARE -> String.format("Direct this %s %.2f towards your most important financial goals!", currency, savings);
                case BUSINESS -> String.format("Reinvest this %s %.2f in business growth or diversified investments!", currency, savings);
                case GIFTS_DONATIONS -> String.format("Consider investing this %s %.2f to create more wealth for future giving!", currency, savings);
                case INVESTMENTS -> String.format("Excellent! Consider diversifying this %s %.2f across different asset classes!", currency, savings);
                case OTHER -> String.format("Put this %s %.2f towards your highest priority financial goal!", currency, savings);
            };
        }
    }
}