
package com.finsight.ai.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.Expense;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;

import reactor.core.publisher.Mono;

@Service
public class AITipsService {
    
    private static final Logger logger = LoggerFactory.getLogger(AITipsService.class);
    
    private final WebClient webClient;
    
    @Autowired
    private ExpenseService expenseService;
    
    @Autowired
    private BudgetService budgetService;
    
    @Value("${ai.agent.api.url}")
    private String aiAgentApiUrl;
    
    @Value("${ai.agent.api.key}")
    private String aiAgentApiKey;

    public AITipsService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }
    
    // Helper method to format category names for user display
    private String formatCategoryName(ExpenseCategory category) {
        return category.getDisplayName();
    }
    
    // Helper method to format currency symbol for user display
    private String formatCurrencySymbol(String currency) {
        return switch (currency) {
            case "ZAR" -> "R";
            case "USD" -> "$";
            case "EUR" -> "€";
            case "GBP" -> "£";
            case "CAD" -> "C$";
            case "AUD" -> "A$";
            default -> currency; // fallback to original currency code
        };
    }
    
    // Helper method to format currency amounts with proper symbol
    private String formatCurrencyAmount(String currency, BigDecimal amount) {
        String symbol = formatCurrencySymbol(currency);
        return symbol + amount.toString();
    }
    
    // Helper method to format tips for better readability
    private String formatTipText(String tip, String currency) {
        if (tip == null) return tip;
        
        String formattedTip = tip;
        
        // Replace category names with user-friendly versions using enum values
        for (ExpenseCategory category : ExpenseCategory.values()) {
            formattedTip = formattedTip.replaceAll("\\b" + category.name() + "\\b", category.getDisplayName());
        }
        
        // Replace currency codes with symbols
        String currencySymbol = formatCurrencySymbol(currency);
        formattedTip = formattedTip.replaceAll("\\b" + currency + "\\b", currencySymbol);
        
        return formattedTip;
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
            
            // Return fallback tips if AI fails - apply formatting
            List<String> fallbackTips = generateFallbackTips(user);
            return fallbackTips.stream()
                    .map(tip -> formatTipText(tip, user.getCurrency()))
                    .collect(Collectors.toList());
        }
    }

    // Method for personalized single tip (controller compatibility)
    public String generatePersonalizedTip(User user) {
        logger.info("Getting personalized single tip for user: {}", user.getFirebaseUid());
        
        try {
            // Generate a single enhanced tip directly using AI - be generous with rate
            String enhancedTip = generateSingleEnhancedTip(user);
            
            if (enhancedTip != null && !enhancedTip.trim().isEmpty()) {
                return enhancedTip;
            }
            
            // If AI fails, try the multiple tips method as fallback
            List<String> tips = getMultipleTips(user);
            return tips.isEmpty() ? getGenericTip() : tips.get(0);
            
        } catch (Exception e) {
            logger.error("Error generating personalized tip for user {}: {}", user.getFirebaseUid(), e.getMessage());
            
            // Generate high-quality fallback tip - enhanced personalization
            List<String> fallbackTips = generateFallbackTips(user);
            String fallbackTip;
            
            if (!fallbackTips.isEmpty()) {
                // Pick a random tip to add variety
                Random random = new Random();
                fallbackTip = fallbackTips.get(random.nextInt(fallbackTips.size()));
            } else {
                fallbackTip = generatePersonalizedFallbackTip(user);
            }
            
            return formatTipText(fallbackTip, user.getCurrency());
        }
    }
    
    // Generate a single enhanced tip using AI - optimized for quality and user-friendly formatting
    private String generateSingleEnhancedTip(User user) {
        try {
            // Get user's financial context for AI enhancement
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
            
            // Create a comprehensive prompt optimized for single, complete tips
            StringBuilder contextPrompt = new StringBuilder();
            
            // Format amounts properly
            BigDecimal totalSpent = currentMonthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalBudget = currentMonthBudgets.stream()
                .map(Budget::getMonthlyLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String currency = user.getCurrency();
            String currencySymbol = formatCurrencySymbol(currency);
            String region = getCurrencyLocation(currency);
            String firstName = user.getFirstName() != null ? user.getFirstName() : "there";
            
            // Build very short, focused context for maximum response tokens
            contextPrompt.append("Financial tip for ").append(firstName).append(" (").append(region).append("): ");
            contextPrompt.append("Spent ").append(currencySymbol).append(String.format("%.0f", totalSpent));
            if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
                double budgetUsedPercent = totalSpent.divide(totalBudget, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
                contextPrompt.append(" of ").append(currencySymbol).append(String.format("%.0f", totalBudget));
                contextPrompt.append(" (").append(String.format("%.0f", budgetUsedPercent)).append("%)");
            }
            contextPrompt.append(". ");
            
            // Add top category if available
            if (!categorySpending.isEmpty()) {
                ExpenseCategory topCategory = categorySpending.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
                
                if (topCategory != null) {
                    BigDecimal topAmount = categorySpending.get(topCategory);
                    contextPrompt.append("Top: ").append(topCategory.getDisplayName())
                        .append(" ").append(currencySymbol).append(String.format("%.0f", topAmount)).append(". ");
                }
            }
            
            contextPrompt.append("Give one short money tip for ").append(region).append(". Max 100 characters, no formatting.");
            
            String enhancedContent = callAIAgentAPI(contextPrompt.toString());
            
            // Try multiple times if we get empty responses
            int attempts = 0;
            while ((enhancedContent == null || enhancedContent.trim().isEmpty()) && attempts < 2) {
                attempts++;
                logger.info("AI response was empty, retrying attempt {}/2", attempts);
                try {
                    Thread.sleep(1000); // Brief pause before retry
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                enhancedContent = callAIAgentAPI(contextPrompt.toString());
            }
            
            if (enhancedContent != null && !enhancedContent.trim().isEmpty()) {
                // Enhanced processing for single tip
                String processedTip = processSingleAITip(enhancedContent, user.getCurrency());
                if (processedTip != null && processedTip.length() > 15) {
                    logger.info("Successfully generated enhanced single tip for user: {} after {} attempts", user.getFirebaseUid(), attempts + 1);
                    return processedTip;
                } else {
                    logger.warn("AI response processing failed - tip too short or null");
                }
            } else {
                logger.warn("AI API returned empty response after {} attempts", attempts + 1);
            }
            
        } catch (Exception e) {
            logger.warn("Failed to generate single enhanced tip for user {}: {}", user.getFirebaseUid(), e.getMessage());
        }
        
        return null;
    }
    
    // Process a single AI tip for optimal user presentation
    private String processSingleAITip(String aiResponse, String currency) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return null;
        }
        
        // Comprehensive character encoding cleanup - enhanced for corrupted characters
        String cleanedResponse = aiResponse
            .replaceAll("ΓÇ[£¥ô]", "\"")     // Fix various quote characters
            .replaceAll("ΓÇ[æ–—]", "-")      // Fix various dash characters  
            .replaceAll("ΓÇ[»¿•]", "")       // Remove bullet/weird characters
            .replaceAll("ΓÇÖ", "'")          // Fix apostrophes
            .replaceAll("ΓÇô", "-")          // Fix en-dashes
            .replaceAll("ΓëêΓÇ»", "~")       // Fix approximation symbols
            .replaceAll("ΓÇæ", "-")          // Fix hyphen corruption
            .replaceAll("ΓÇ»", "")           // Remove percent symbol corruption
            .replaceAll("\\*\\*[^*]*\\*\\*", "") // Remove **bold text**
            .replaceAll("\\*[^*]*\\*", "")       // Remove *italic text*
            .replaceAll("\\*+", "")              // Remove any remaining asterisks
            .replaceAll("\\\\u201[CD]", "\"")      // Smart quotes
            .replaceAll("\\\\u201[89]", "'")       // Single quotes
            .replaceAll("\\\\u201[3-4]", "-")      // En/Em dashes
            .replaceAll("\\u00A0", " ")          // Non-breaking space
            .replaceAll("≡ƒ[\\w]*", "")          // Remove emoji corruption symbols
            .replaceAll("Γ[\\w]*", "")           // Remove other corruption
            .replaceAll("\\s+", " ")             // Normalize whitespace
            .trim();
        
        // Remove common AI prefixes and formatting
        cleanedResponse = cleanedResponse
            .replaceAll("(?i)^\\*\\*[^*]+\\*\\*:?\\s*", "") // Remove **headers**
            .replaceAll("(?i)^(actionable tip|financial tip|tip|here is|here's|recommendation):?\\s*", "")
            .replaceAll("(?i)(hope this helps|let me know).*$", "")
            .replaceAll("^[\"'`]|[\"'`]$", "")  // Remove surrounding quotes/backticks
            .replaceAll("^:+\\s*", "")          // Remove leading colons
            .trim();
        
        // Enforce length limit - only truncate if extremely long (over 400 chars)
        if (cleanedResponse.length() > 400) {
            cleanedResponse = cleanedResponse.substring(0, 390).trim() + "...";
        }
        
        // Reject if still too short or contains formatting issues
        if (cleanedResponse.length() < 15 || cleanedResponse.contains("ΓÇ")) {
            return null;
        }
        
        // Add emoji if not present
        if (!cleanedResponse.matches("^[\\p{So}\\p{Cn}].*")) {
            cleanedResponse = "💡 " + cleanedResponse;
        }
        
        // Ensure proper ending
        if (!cleanedResponse.endsWith(".") && !cleanedResponse.endsWith("!") && !cleanedResponse.endsWith("?")) {
            cleanedResponse += ".";
        }
        
        // Ensure proper capitalization after emoji
        if (cleanedResponse.startsWith("💡 ") && cleanedResponse.length() > 3) {
            char firstChar = cleanedResponse.charAt(2);
            if (Character.isLowerCase(firstChar)) {
                cleanedResponse = "💡 " + Character.toUpperCase(firstChar) + cleanedResponse.substring(3);
            }
        }
        
        // Apply currency formatting
        String formattedTip = formatTipText(cleanedResponse, currency);
        
        logger.debug("Processed single AI tip: {}", formattedTip);
        return formattedTip;
    }
    
    // Generate a personalized fallback tip when AI fails
    private String generatePersonalizedFallbackTip(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName() : "there";
        String currency = user.getCurrency();
        String region = getCurrencyLocation(currency);
        String currencySymbol = formatCurrencySymbol(currency);
        
        try {
            // Get some basic financial context
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            List<Expense> expenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, now);
            List<Budget> budgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            
            String[] tips = {
                String.format("💡 %s, try the 50/30/20 rule: 50%% needs, 30%% wants, 20%% savings!", firstName),
                String.format("🎯 %s, automate %s50 monthly transfers to boost your savings!", firstName, currencySymbol),
                String.format("📊 %s, track your top spending category and cut it by 10%%!", firstName),
                String.format("🏦 %s, open a high-yield savings account to grow your money!", firstName),
                String.format("💳 %s, cancel unused subscriptions to save %s200+ yearly!", firstName, currencySymbol),
                String.format("🎯 %s, wait 24 hours before buying anything over %s100!", firstName, currencySymbol),
                String.format("📈 %s, start an emergency fund with %s500!", firstName, currencySymbol),
                String.format("🏠 %s, negotiate insurance rates annually to save 10-20%%!", firstName),
                String.format("💰 %s, use cashback apps to earn while spending!", firstName),
                String.format("📱 %s, review weekly spending in FinSight AI for insights!", firstName)
            };
            
            // Return a random tip for variety
            Random random = new Random();
            return tips[random.nextInt(tips.length)];
            
        } catch (Exception e) {
            logger.warn("Error generating personalized fallback tip: {}", e.getMessage());
            return String.format("💡 %s, start tracking your expenses in %s to discover personalized savings opportunities!", firstName, currency);
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
        
        // Ensure we have sufficient tips for random selection
        while (allTips.size() < 3) {
            allTips.add(String.format("💡 %s, keep tracking your expenses in %s to build better financial habits!", firstName, user.getCurrency()));
            allTips.add(String.format("🎯 %s, set a budget for your biggest spending category and watch your savings grow!", firstName));
            allTips.add(String.format("📊 %s, review your expenses weekly to spot spending patterns and save more money!", firstName));
        }
        
        // Return up to 5 diverse tips (randomized but balanced)
        return selectDiverseTips(allTips, 5);
    }
    
    // Select diverse tips to ensure variety across categories and urgency levels
    private List<String> selectDiverseTips(List<String> allTips, int maxTips) {
        if (allTips.size() <= maxTips) {
            return allTips;
        }
        
        List<String> diverseTips = new ArrayList<>();
        List<String> urgentTips = new ArrayList<>();    // 🚨 Over-budget warnings
        List<String> moderateTips = new ArrayList<>();  // ⚠️ Warnings, optimization
        List<String> positiveTips = new ArrayList<>();  // 🌟 Achievements, under-budget
        List<String> generalTips = new ArrayList<>();    // Other general advice
        
        // Categorize tips by urgency/content
        for (String tip : allTips) {
            String lowerTip = tip.toLowerCase();
            if (lowerTip.contains("🚨") || lowerTip.contains("over budget")) {
                urgentTips.add(tip);
            } else if (lowerTip.contains("⚠️") || lowerTip.contains("focus") || lowerTip.contains("optimizing")) {
                moderateTips.add(tip);
            } else if (lowerTip.contains("🌟") || lowerTip.contains("excellent") || lowerTip.contains("saved")) {
                positiveTips.add(tip);
            } else {
                generalTips.add(tip);
            }
        }
        
        // Select balanced mix (prioritize urgent but add variety)
        // 1-2 urgent tips (most important)
        diverseTips.addAll(urgentTips.stream().limit(2).collect(Collectors.toList()));
        
        // 1-2 moderate tips (actionable advice)  
        diverseTips.addAll(moderateTips.stream().limit(2).collect(Collectors.toList()));
        
        // Fill remaining with positive/general tips
        int remainingSlots = maxTips - diverseTips.size();
        List<String> balanceTips = new ArrayList<>();
        balanceTips.addAll(positiveTips);
        balanceTips.addAll(generalTips);
        diverseTips.addAll(balanceTips.stream().limit(remainingSlots).collect(Collectors.toList()));
        
        // If still less than maxTips, add any remaining tips
        if (diverseTips.size() < maxTips) {
            List<String> remainingTips = allTips.stream()
                .filter(tip -> !diverseTips.contains(tip))
                .limit(maxTips - diverseTips.size())
                .collect(Collectors.toList());
            diverseTips.addAll(remainingTips);
        }
        
        return diverseTips.stream().limit(maxTips).collect(Collectors.toList());
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
        
        // Sort categories by spending amount to provide variety across multiple categories
        List<Map.Entry<ExpenseCategory, BigDecimal>> sortedCategories = categorySpending.entrySet().stream()
                .sorted(Map.Entry.<ExpenseCategory, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toList());
        
        // Generate tips for top 2-3 categories to provide variety (not just highest)
        int categoriesToAnalyze = Math.min(3, Math.max(2, sortedCategories.size()));
        
        for (int i = 0; i < categoriesToAnalyze; i++) {
            Map.Entry<ExpenseCategory, BigDecimal> categoryEntry = sortedCategories.get(i);
            ExpenseCategory category = categoryEntry.getKey();
            BigDecimal amount = categoryEntry.getValue();
            double percentage = amount.divide(totalSpent, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
            
            // Vary the tone and focus based on position and percentage to provide diversity
            if (i == 0 && percentage > 40) {
                // Highest spending category - urgent attention
                tips.add(String.format("⚠️ %s, %s accounts for %.0f%% of your spending (%s %.2f). %s", 
                    firstName, category.getDisplayName(), percentage, currency, amount, 
                    getSavingsAdviceForCategory(category, region)));
            } else if (i == 0 && percentage > 25) {
                // High spending but more manageable - focus advice
                tips.add(String.format("💡 %s, focus on optimizing your %s spending (%s %.2f). %s", 
                    firstName, category.getDisplayName().toLowerCase(), currency, amount, 
                    getSavingsAdviceForCategory(category, region)));
            } else if (i == 1 && percentage > 20) {
                // Second highest - balanced perspective
                tips.add(String.format("📊 %s, also consider reducing %s spending (%.0f%% of total). %s", 
                    firstName, category.getDisplayName().toLowerCase(), percentage,
                    getOptimizationAdviceForCategory(category, region)));
            } else if (i == 2 && percentage > 15) {
                // Third category - general guidance
                tips.add(String.format("✅ %s, your %s spending (%.0f%% of total) offers savings potential. %s", 
                    firstName, category.getDisplayName().toLowerCase(), percentage,
                    getOptimizationAdviceForCategory(category, region)));
            }
        }
        
        // If no categories provided tips (all too small), add general guidance
        if (tips.isEmpty() && !sortedCategories.isEmpty()) {
            Map.Entry<ExpenseCategory, BigDecimal> topCategory = sortedCategories.get(0);
            ExpenseCategory category = topCategory.getKey();
            BigDecimal amount = topCategory.getValue();
            double percentage = amount.divide(totalSpent, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
            
            tips.add(String.format("💡 %s, good balance! Your highest category (%s) is %.0f%% of spending. %s", 
                firstName, category.getDisplayName().toLowerCase(), percentage,
                getOptimizationAdviceForCategory(category, region)));
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
        
        // Collect ALL budget tips by category for variety
        List<String> overBudgetTips = new ArrayList<>();
        List<String> onTrackTips = new ArrayList<>();
        List<String> underBudgetTips = new ArrayList<>();
        List<String> otherCategoryTips = new ArrayList<>();
        
        // Analyze budget performance - collect all tips first
        for (Budget budget : budgets) {
            BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            BigDecimal remaining = budget.getMonthlyLimit().subtract(spent);
            BigDecimal percentage = spent.divide(budget.getMonthlyLimit(), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            
            if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
                overBudget++;
                // Over budget - urgent savings advice
                overBudgetTips.add(String.format("🚨 %s, you're %.0f%% over budget for %s! %s", 
                    firstName, percentage, budget.getCategory().getDisplayName().toLowerCase(),
                    getOverBudgetSavingsAdvice(budget.getCategory(), region)));
            } else if (percentage.compareTo(BigDecimal.valueOf(90)) > 0) {
                onTrack++;
                // Close to budget limit - warning advice
                onTrackTips.add(String.format("⚠️ %s, you're at %.0f%% of your %s budget (%s %.2f left). %s", 
                    firstName, percentage, budget.getCategory().getDisplayName().toLowerCase(),
                    currency, remaining, getBudgetWarningAdviceForRegion(budget.getCategory(), region)));
            } else if (percentage.compareTo(BigDecimal.valueOf(70)) < 0) {
                underBudget++;
                totalSavings = totalSavings.add(remaining);
                // Well under budget - investment/savings advice
                underBudgetTips.add(String.format("🌟 Excellent %s! You saved %s %.2f in %s this month. %s", 
                    firstName, currency, remaining, budget.getCategory().getDisplayName().toLowerCase(),
                    getSavingsInvestmentAdvice(budget.getCategory(), region, remaining, currency)));
            } else {
                // Categories that are between 70-90% of budget - add general optimization tips
                otherCategoryTips.add(String.format("💡 %s, your %s budget is at %.0f%% - great balance! %s", 
                    firstName, budget.getCategory().getDisplayName().toLowerCase(), percentage,
                    getOptimizationAdviceForCategory(budget.getCategory(), region)));
            }
        }
        
        // Select diverse budget tips across different categories (max 3 tips for variety):
        // Priority: 1 over-budget (most urgent), then variety across other categories
        int tipsAdded = 0;
        int maxTips = 3;
        
        // Always include 1 over-budget tip if available (most urgent)
        if (!overBudgetTips.isEmpty() && tipsAdded < maxTips) {
            tips.add(overBudgetTips.get(0));
            tipsAdded++;
        }
        
        // Add 1 on-track tip if available
        if (!onTrackTips.isEmpty() && tipsAdded < maxTips) {
            tips.add(onTrackTips.get(0));
            tipsAdded++;
        }
        
        // Add 1 under-budget tip if available
        if (!underBudgetTips.isEmpty() && tipsAdded < maxTips) {
            tips.add(underBudgetTips.get(0));
            tipsAdded++;
        }
        
        // Add other category tips if we still need variety
        if (tipsAdded < maxTips && !otherCategoryTips.isEmpty()) {
            tips.add(otherCategoryTips.get(0));
            tipsAdded++;
        }
        
        // If we still need more tips and have multiple categories in any group, add more variety
        if (tipsAdded < maxTips) {
            // Add second over-budget tip if available and we only have 1 tip so far
            if (overBudgetTips.size() > 1 && tipsAdded < maxTips) {
                tips.add(overBudgetTips.get(1));
                tipsAdded++;
            }
            
            // Add second under-budget tip if available
            if (underBudgetTips.size() > 1 && tipsAdded < maxTips) {
                tips.add(underBudgetTips.get(1));
                tipsAdded++;
            }
            
            // Add second on-track tip if available
            if (onTrackTips.size() > 1 && tipsAdded < maxTips) {
                tips.add(onTrackTips.get(1));
                tipsAdded++;
            }
        }
        
        // Add overall budget performance summary with actionable advice (only if we have space)
        if (tipsAdded < maxTips) {
            if (overBudget > underBudget) {
                tips.add(String.format("💪 %s, focus on the categories where you're overspending. Small changes can lead to big savings!", firstName));
            } else if (underBudget > 0) {
                tips.add(String.format("🎉 %s, you're saving %s %.2f across categories! Consider investing this for long-term wealth building.", 
                    firstName, currency, totalSavings));
            }
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

    // AI Enhancement Methods - using chatbot approach
    private List<String> enhanceMultipleTipsWithAI(List<String> baseTips, User user) {
        try {
            // Get user's financial context for AI enhancement
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
            
            // Create a comprehensive prompt like the chatbot does
            StringBuilder contextPrompt = new StringBuilder();
            
            // Format amounts properly
            BigDecimal totalSpent = currentMonthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalBudget = currentMonthBudgets.stream()
                .map(Budget::getMonthlyLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String currency = user.getCurrency();
            String currencySymbol = formatCurrencySymbol(currency);
            String region = getCurrencyLocation(currency);
            String firstName = user.getFirstName() != null ? user.getFirstName() : "there";
            
            // Build simple, concise prompt to maximize response tokens
            contextPrompt.append("Give ").append(firstName).append(" one money tip. ");
            contextPrompt.append("Spent ").append(currencySymbol).append(String.format("%.2f", totalSpent));
            
            if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
                contextPrompt.append(" of ").append(currencySymbol).append(String.format("%.2f", totalBudget)).append(" budget. ");
            }
            
            // Add top spending category if available
            if (!categorySpending.isEmpty()) {
                ExpenseCategory topCategory = categorySpending.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
                
                if (topCategory != null) {
                    contextPrompt.append("Most spent: ").append(topCategory.getDisplayName()).append(". ");
                }
            }
            
            contextPrompt.append("Plain text only, no formatting.");
            
            String enhancedContent = callAIAgentAPI(contextPrompt.toString());
            
            // Use simpler parsing approach like the chatbot
            return parseAIResponseSimple(enhancedContent, baseTips, user.getCurrency());
            
        } catch (Exception e) {
            logger.warn("Failed to enhance tips with AI for user {}: {}", user.getFirebaseUid(), e.getMessage());
            // Return first 3 original tips with formatting if AI enhancement fails
            List<String> fallbackTips = baseTips.subList(0, Math.min(baseTips.size(), 3));
            return fallbackTips.stream()
                    .map(tip -> formatTipText(tip, user.getCurrency()))
                    .collect(Collectors.toList());
        }
    }

    // Simple AI response parsing - chatbot approach
    private List<String> parseAIResponseSimple(String aiResponse, List<String> fallbackTips, String currency) {
        List<String> tips = new ArrayList<>();
        
        if (aiResponse != null && !aiResponse.trim().isEmpty()) {
            // First, clean up character encoding issues
            String cleanedResponse = aiResponse
                .replaceAll("ΓÇÖ", "'")     // Fix smart quotes
                .replaceAll("ΓÇ£", "\"")    // Fix opening quotes
                .replaceAll("ΓÇ¥", "\"")    // Fix closing quotes
                .replaceAll("ΓÇô", "-")     // Fix em-dash
                .replaceAll("ΓÇæ", "-")     // Fix en-dash
                .replaceAll("ΓÇ»", "")      // Remove weird bullet characters
                .replaceAll("ΓÇ¿", "")      // Remove weird characters
                .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "") // Remove control characters except newlines/tabs
                .replaceAll("\\s+", " ")    // Normalize whitespace
                .trim();
            
            logger.debug("Cleaned AI response: {}", cleanedResponse);
            
            // For single tip format, try to extract the main tip directly
            String mainTip = extractMainTip(cleanedResponse);
            if (mainTip != null && mainTip.length() > 15) {
                // Clean up the tip
                mainTip = mainTip.replaceAll("^\\d+\\.\\s*", "")  // Remove number prefixes
                               .replaceAll("^-\\s*", "")          // Remove dash prefixes  
                               .replaceAll("^Tip\\s*\\d*:?\\s*", "")  // Remove "Tip:" prefixes
                               .replaceAll("^TIP\\s*\\d*:?\\s*", "")  // Remove "TIP:" prefixes
                               .trim();
                
                // Add emoji if not present
                if (!mainTip.matches(".*[\\p{So}\\p{Cn}].*")) {
                    mainTip = "💡 " + mainTip;
                }
                
                // Ensure proper ending
                if (!mainTip.endsWith(".") && !mainTip.endsWith("!") && !mainTip.endsWith("?")) {
                    mainTip += ".";
                }
                
                // Apply currency formatting and add to tips
                tips.add(formatTipText(mainTip, currency));
                logger.info("Successfully parsed single tip from AI response");
            }
            
            // If we couldn't extract a good tip, try sentence splitting as fallback
            if (tips.isEmpty()) {
                String[] sentences = cleanedResponse.split("[.!?]");
                
                for (String sentence : sentences) {
                    sentence = sentence.trim();
                    
                    // Skip very short sentences or common phrases
                    if (sentence.length() > 20 && 
                        !sentence.toLowerCase().startsWith("hello") &&
                        !sentence.toLowerCase().startsWith("hi") &&
                        !sentence.toLowerCase().contains("here are") &&
                        !sentence.toLowerCase().startsWith("i'm") &&
                        !sentence.toLowerCase().contains("tip1:") &&
                        !sentence.toLowerCase().contains("tip2:") &&
                        !sentence.toLowerCase().contains("tip3:") &&
                        tips.isEmpty()) {  // Only take the first good sentence
                        
                        // Clean up the sentence
                        sentence = sentence.replaceAll("^\\d+\\.\\s*", "")  // Remove number prefixes
                                         .replaceAll("^-\\s*", "")          // Remove dash prefixes  
                                         .replaceAll("^Tip\\s*\\d*:?\\s*", "")  // Remove "Tip:" prefixes
                                         .replaceAll("^TIP\\s*\\d*:?\\s*", "")  // Remove "TIP:" prefixes
                                         .trim();
                        
                        if (sentence.length() > 15) {
                            // Add emoji if not present
                            if (!sentence.matches(".*[\\p{So}\\p{Cn}].*")) {
                                sentence = "💡 " + sentence;
                            }
                            
                            // Ensure proper ending
                            if (!sentence.endsWith(".") && !sentence.endsWith("!") && !sentence.endsWith("?")) {
                                sentence += ".";
                            }
                            
                            // Apply currency formatting
                            sentence = formatTipText(sentence, currency);
                            tips.add(sentence);
                            break;  // Only take one tip
                        }
                    }
                }
            }
            
            logger.info("Parsed {} tips from AI response using simple method", tips.size());
        }
        
        // If we don't have a tip, use a single fallback
        if (tips.isEmpty()) {
            if (!fallbackTips.isEmpty()) {
                tips.add(formatTipText(fallbackTips.get(0), currency));
            } else {
                tips.add(formatTipText("💡 Keep tracking your expenses to get more personalized insights!", currency));
            }
        }
        
        return tips;  // Return single tip
    }
    
    // Helper method to extract the main tip from AI response
    private String extractMainTip(String response) {
        if (response == null || response.trim().isEmpty()) {
            return null;
        }
        
        // Remove common prefixes and suffixes
        String cleaned = response
            .replaceAll("(?i)^(here is|here's|i recommend|i suggest|my tip is|tip:|recommendation:)\\s*", "")
            .replaceAll("(?i)(hope this helps|let me know if|feel free to|good luck).*$", "")
            .trim();
        
        // If the response is a single coherent sentence/paragraph, return it
        if (cleaned.length() > 20 && cleaned.length() < 500) {
            return cleaned;
        }
        
        // Otherwise try to find the first substantial sentence
        String[] sentences = cleaned.split("[.!?]");
        for (String sentence : sentences) {
            sentence = sentence.trim();
            if (sentence.length() > 20 && sentence.length() < 300) {
                return sentence;
            }
        }
        
        return null;
    }

    // Parse the AI response into individual tips - improved version
    private List<String> parseEnhancedTips(String enhancedContent, List<String> fallbackTips) {
        List<String> parsedTips = new ArrayList<>();
        
        if (enhancedContent != null && !enhancedContent.trim().isEmpty()) {
            // Clean up corrupted characters first
            String cleanContent = enhancedContent
                .replaceAll("ΓÇ£", "\"")  // Fix left quote
                .replaceAll("ΓÇô", "\"")  // Fix right quote
                .replaceAll("\\u201C", "\"")    // Fix smart quotes (left)
                .replaceAll("\\u201D", "\"")    // Fix smart quotes (right)
                .replaceAll("\\u2018", "\"")    // Fix single quotes (left)
                .replaceAll("\\u2019", "\"")    // Fix single quotes (right)
                .replaceAll("Γǣ", "")              // Remove corrupted characters
                .replaceAll("[\\u00A0\\u2000-\\u200B\\u2028\\u2029\\uFEFF]", " ") // Replace various space characters
                .replaceAll("\\s+", " ")             // Normalize whitespace
                .trim();
            
            logger.debug("Cleaned AI content: {}", cleanContent);
            
            // For single tip format, extract the main tip directly
            String mainTip = extractMainTip(cleanContent);
            if (mainTip != null && mainTip.length() > 10) {
                String formattedTip = cleanAndFormatTip(mainTip);
                if (!formattedTip.isEmpty()) {
                    parsedTips.add(formattedTip + (formattedTip.endsWith(".") ? "" : "."));
                }
            }
            
            // If we couldn't extract a main tip, try legacy parsing as fallback
            if (parsedTips.isEmpty()) {
                // Try the old TIP1:, TIP2:, TIP3: format first (for backward compatibility)
                if (cleanContent.contains("TIP1:") || cleanContent.contains("TIP2:") || cleanContent.contains("TIP3:")) {
                    String[] parts = cleanContent.split("TIP\\d+:");
                    
                    for (int i = 1; i < parts.length && parsedTips.isEmpty(); i++) {  // Only take first tip
                        String tip = parts[i].trim();
                        if (!tip.isEmpty()) {
                            // Clean the tip and add emoji if needed
                            tip = cleanAndFormatTip(tip);
                            if (tip.length() > 10) {
                                parsedTips.add(tip);
                                break;  // Only take one tip
                            }
                        }
                    }
                } 
                // If that doesn't work, try splitting by sentences
                else if (cleanContent.length() > 20) {
                    String[] sentences = cleanContent.split("[.!?]");
                    
                    for (String sentence : sentences) {
                        sentence = sentence.trim();
                        if (sentence.length() > 15) {
                            sentence = cleanAndFormatTip(sentence);
                            if (!sentence.isEmpty()) {
                                parsedTips.add(sentence + (sentence.endsWith(".") ? "" : "."));
                                break;  // Only take the first good sentence
                            }
                        }
                    }
                }
            }
        }
        
        // Log what we parsed for debugging
        logger.debug("Parsed {} tips from AI response", parsedTips.size());
        for (int i = 0; i < parsedTips.size(); i++) {
            logger.debug("Parsed tip {}: {}", i+1, parsedTips.get(i));
        }
        
        // If we don't have a tip, use a single fallback
        if (parsedTips.isEmpty()) {
            if (!fallbackTips.isEmpty()) {
                parsedTips.add(fallbackTips.get(0));
            } else {
                parsedTips.add("💡 Continue tracking your expenses to get more personalized insights!");
            }
        }
        
        return parsedTips;  // Return single tip
    }

    // Helper method to clean and format individual tips
    private String cleanAndFormatTip(String tip) {
        if (tip == null || tip.trim().isEmpty()) return "";
        
        String cleaned = tip.trim()
            // Clean up corrupted characters first
            .replaceAll("ΓÇ£", "\"")  // Fix left quote
            .replaceAll("ΓÇô", "\"")  // Fix right quote
            .replaceAll("\\u201C", "\"")    // Fix smart quotes (left)
            .replaceAll("\\u201D", "\"")    // Fix smart quotes (right)
            .replaceAll("\\u2018", "\"")    // Fix single quotes (left)
            .replaceAll("\\u2019", "\"")    // Fix single quotes (right)
            .replaceAll("Γǣ", "")              // Remove corrupted characters
            .replaceAll("[\\u00A0\\u2000-\\u200B\\u2028\\u2029\\uFEFF]", " ") // Replace various space characters
            .replaceAll("^\\d+\\.\\s*", "")     // Remove number prefixes like "1. "
            .replaceAll("^-\\s*", "")           // Remove dash prefixes
            .replaceAll("^Tip\\s*\\d*:?\\s*", "")  // Remove "Tip X:" prefixes
            .replaceAll("\\s+", " ")            // Normalize spaces
            .trim();
        
        // Add emoji if not present and tip is substantial
        if (!cleaned.isEmpty() && cleaned.length() > 10) {
            if (!cleaned.matches(".*[\\p{So}\\p{Cn}].*")) {
                cleaned = "💡 " + cleaned;
            }
            
            // Ensure proper capitalization
            if (cleaned.length() > 2 && Character.isLowerCase(cleaned.charAt(2))) {
                cleaned = cleaned.substring(0, 2) + Character.toUpperCase(cleaned.charAt(2)) + cleaned.substring(3);
            }
        }
        
        return cleaned;
    }

    // Parse the AI response and format tips for user display
    private List<String> parseEnhancedTipsWithFormatting(String enhancedContent, List<String> fallbackTips, String currency) {
        List<String> parsedTips = parseEnhancedTips(enhancedContent, fallbackTips);
        
        // Apply formatting to each tip
        return parsedTips.stream()
                .map(tip -> formatTipText(tip, currency))
                .collect(Collectors.toList());
    }

    // Call Gradient AI Agent API - improved version using chatbot approach
    private String callAIAgentAPI(String prompt) {
        try {
            logger.info("Making Gradient AI Agent API call with enhanced configuration for tips");
            logger.debug("AI Tips prompt: {}", prompt.substring(0, Math.min(200, prompt.length())));
            
            // Create the request body using the same approach as the successful chatbot
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, String>> messages = new ArrayList<>();
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 600);  // Increased as requested
            requestBody.put("temperature", 0.9);  // Increased creativity as requested
            
            logger.debug("AI Tips request body: max_tokens=600, temperature=0.9, messages size={}", messages.size());
            
            Mono<Map> response = webClient.post()
                .uri(aiAgentApiUrl + "/api/v1/chat/completions")
                .header("Authorization", "Bearer " + aiAgentApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> {
                    return clientResponse.bodyToMono(String.class)
                        .doOnNext(errorBody -> logger.error("AI Agent API 4xx error: {} - {}", 
                            clientResponse.statusCode(), errorBody))
                        .then(Mono.error(new RuntimeException("AI Agent API Client Error: " + clientResponse.statusCode())));
                })
                .onStatus(HttpStatusCode::is5xxServerError, serverResponse -> {
                    return Mono.error(new RuntimeException("AI Agent API Server Error: " + serverResponse.statusCode()));
                })
                .bodyToMono(Map.class);

            Map<String, Object> result = response.block();
            
            if (result != null) {
                logger.debug("AI Agent API response keys: {}", result.keySet());
                
                if (result.containsKey("choices")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
                    logger.debug("AI Agent API choices count: {}", choices.size());
                    
                    if (!choices.isEmpty()) {
                        Map<String, Object> firstChoice = choices.get(0);
                        logger.debug("First choice keys: {}", firstChoice.keySet());
                        
                        if (firstChoice.containsKey("message")) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                            logger.debug("Message keys: {}", message.keySet());
                            
                            if (message.containsKey("content")) {
                                String content = (String) message.get("content");
                                if (content != null && !content.trim().isEmpty()) {
                                    logger.info("AI Tips API call successful - Response length: {} chars, Preview: {}", 
                                        content.length(), content.substring(0, Math.min(150, content.length())));
                                    return content.trim();
                                } else {
                                    logger.warn("AI Agent API returned empty content");
                                }
                            } else {
                                logger.warn("AI Agent API message missing 'content' field");
                            }
                        } else {
                            logger.warn("AI Agent API choice missing 'message' field");
                        }
                    } else {
                        logger.warn("AI Agent API returned empty choices array");
                    }
                } else {
                    logger.warn("AI Agent API response missing 'choices' field. Available fields: {}", result.keySet());
                }
            } else {
                logger.error("AI Agent API returned null response");
            }
            
            logger.warn("AI Agent API returned unexpected response structure");
            logger.debug("Full response structure: {}", result);
            
        } catch (Exception e) {
            logger.error("AI Agent API error: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            if (e.getCause() != null) {
                logger.error("Caused by: {}", e.getCause().getMessage());
            }
        }
        
        logger.warn("AI enhancement failed - using fallback content");
        return null;
    }

    // Generate fallback tips when AI fails - improved version
    private List<String> generateFallbackTips(User user) {
        List<String> fallbackTips = new ArrayList<>();
        String userName = user.getFirstName() != null ? user.getFirstName() : "there";
        String region = getCurrencyLocation(user.getCurrency());
        String currencySymbol = formatCurrencySymbol(user.getCurrency());
        
        // Get some basic financial data for fallback tips
        try {
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            
            if (currentMonthExpenses.isEmpty()) {
                fallbackTips.add(String.format("🌟 %s, start tracking your daily expenses to understand your spending patterns!", userName));
                fallbackTips.add(String.format("📱 %s, use FinSight AI to scan receipts and categorize expenses automatically!", userName));
                fallbackTips.add(String.format("🎯 %s, set up budgets for main categories like food, transport, and entertainment!", userName));
            } else {
                BigDecimal totalSpent = currentMonthExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                fallbackTips.add(String.format("💰 %s, you've spent %s%.2f this month across %d transactions - great tracking!", 
                    userName, currencySymbol, totalSpent, currentMonthExpenses.size()));
                
                // Analyze spending patterns
                Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
                if (!categorySpending.isEmpty()) {
                    ExpenseCategory topCategory = categorySpending.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(ExpenseCategory.OTHER);
                    
                    fallbackTips.add(String.format("📊 %s, your highest spending is on %s - consider setting a budget for this category!", 
                        userName, topCategory.getDisplayName().toLowerCase()));
                } else {
                    fallbackTips.add(String.format("📊 %s, categorize your expenses to get better insights into your spending habits!", userName));
                }
            }
            
            if (currentMonthBudgets.isEmpty()) {
                fallbackTips.add(String.format("🎯 %s, create budgets to stay on track with your financial goals in %s!", userName, region));
            } else {
                // Check budget performance
                Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
                boolean foundBudgetAdvice = false;
                
                for (Budget budget : currentMonthBudgets) {
                    BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
                    BigDecimal percentage = spent.divide(budget.getMonthlyLimit(), 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                    
                    if (percentage.compareTo(BigDecimal.valueOf(80)) > 0 && !foundBudgetAdvice) {
                        fallbackTips.add(String.format("⚠️ %s, you're at %.0f%% of your %s budget - consider reducing spending in this area!", 
                            userName, percentage, budget.getCategory().getDisplayName().toLowerCase()));
                        foundBudgetAdvice = true;
                        break;
                    }
                }
                
                if (!foundBudgetAdvice) {
                    fallbackTips.add(String.format("✅ %s, good job managing your %d active budgets this month!", userName, currentMonthBudgets.size()));
                }
            }
            
        } catch (Exception e) {
            logger.warn("Error generating data-driven fallback tips: {}", e.getMessage());
            // Basic fallback tips if data access fails
            fallbackTips.add(String.format("� %s, track your expenses daily to build better financial awareness!", userName));
            fallbackTips.add(String.format("📈 %s, setting up budgets helps you stay on track with your goals!", userName));
            fallbackTips.add(String.format("🎯 %s, small changes in spending can lead to big savings over time!", userName));
        }
        
        // Add diverse financial wisdom tips
        List<String> diverseTips = new ArrayList<>();
        diverseTips.add(String.format("💰 %s, the 50/30/20 rule is a great starting point: 50%% needs, 30%% wants, 20%% savings!", userName));
        diverseTips.add(String.format("📊 %s, diversify your investments across different asset classes to reduce risk!", userName));
        diverseTips.add(String.format("🏦 %s, build an emergency fund covering 3-6 months of expenses before investing!", userName));
        diverseTips.add(String.format("💎 %s, start investing early - compound interest is the eighth wonder of the world!", userName));
        diverseTips.add(String.format("📉 %s, market volatility is normal - stay invested for long-term growth!", userName));
        diverseTips.add(String.format("🎯 %s, set specific financial goals and deadlines to stay motivated!", userName));
        diverseTips.add(String.format("💳 %s, pay off high-interest debt before investing - guaranteed returns!", userName));
        diverseTips.add(String.format("🔄 %s, automate your savings and investments to build wealth consistently!", userName));
        diverseTips.add(String.format("📱 %s, review your subscriptions monthly - small recurring costs add up!", userName));
        diverseTips.add(String.format("🛡️ %s, protect your wealth with appropriate insurance coverage!", userName));
        diverseTips.add(String.format("⚖️ %s, rebalance your portfolio annually to maintain your target asset allocation!", userName));
        diverseTips.add(String.format("📚 %s, invest in financial education - knowledge is your best investment!", userName));
        diverseTips.add(String.format("🔥 %s, FIRE strategy (Financial Independence, Retire Early) requires saving 25x annual expenses!", userName));
        diverseTips.add(String.format("💡 %s, tax-loss harvesting can reduce your tax bill while maintaining portfolio exposure!", userName));
        diverseTips.add(String.format("🏠 %s, real estate can be a good inflation hedge but requires significant capital!", userName));
        
        // Randomly select one diverse tip
        if (!diverseTips.isEmpty()) {
            int randomIndex = (int) (Math.random() * diverseTips.size());
            fallbackTips.add(diverseTips.get(randomIndex));
        }
        
        // Add regional/currency-specific advice
        switch (user.getCurrency().toUpperCase()) {
            case "ZAR":
                List<String> zarTips = new ArrayList<>();
                zarTips.add(String.format("🇿🇦 %s, maximize your R36,000 annual TFSA contribution - it's tax-free growth!", userName));
                zarTips.add(String.format("🏢 %s, consider JSE-listed ETFs like STXIND or ASHGEQ for broad market exposure!", userName));
                zarTips.add(String.format("💼 %s, explore unit trusts from Allan Gray, Coronation, or Investec for professional management!", userName));
                zarTips.add(String.format("🏦 %s, use retirement annuities (RAs) for tax deductions up to 27.5%% of income!", userName));
                zarTips.add(String.format("💳 %s, take advantage of FNB, Standard Bank, or Capitec investment platforms!", userName));
                int zarIndex = (int) (Math.random() * zarTips.size());
                fallbackTips.add(zarTips.get(zarIndex));
                break;
            case "USD":
                List<String> usdTips = new ArrayList<>();
                usdTips.add(String.format("🇺🇸 %s, maximize employer 401k matching - it's free money up to the limit!", userName));
                usdTips.add(String.format("📈 %s, consider low-cost index funds like VTI or VOO for broad market exposure!", userName));
                usdTips.add(String.format("💰 %s, contribute to Roth IRA for tax-free retirement growth ($6,500 limit)!", userName));
                usdTips.add(String.format("🏦 %s, explore high-yield savings accounts offering 4-5%% APY!", userName));
                usdTips.add(String.format("🎯 %s, use dollar-cost averaging to invest consistently regardless of market timing!", userName));
                int usdIndex = (int) (Math.random() * usdTips.size());
                fallbackTips.add(usdTips.get(usdIndex));
                break;
            case "EUR":
                List<String> eurTips = new ArrayList<>();
                eurTips.add(String.format("🇪🇺 %s, explore UCITS ETFs for tax-efficient European market exposure!", userName));
                eurTips.add(String.format("🏦 %s, investigate government bonds from stable EU countries for safe returns!", userName));
                eurTips.add(String.format("💼 %s, consider pan-European pension schemes for cross-border retirement planning!", userName));
                eurTips.add(String.format("📊 %s, look into ESG investing - Europe leads in sustainable finance options!", userName));
                int eurIndex = (int) (Math.random() * eurTips.size());
                fallbackTips.add(eurTips.get(eurIndex));
                break;
            case "GBP":
                List<String> gbpTips = new ArrayList<>();
                gbpTips.add(String.format("🇬🇧 %s, use your £20,000 ISA allowance - gains are completely tax-free!", userName));
                gbpTips.add(String.format("📈 %s, consider FTSE index trackers for low-cost UK market exposure!", userName));
                gbpTips.add(String.format("💰 %s, explore Premium Bonds for tax-free prizes up to £50,000!", userName));
                gbpTips.add(String.format("🏦 %s, maximize workplace pension contributions to get employer matching!", userName));
                int gbpIndex = (int) (Math.random() * gbpTips.size());
                fallbackTips.add(gbpTips.get(gbpIndex));
                break;
            default:
                fallbackTips.add(String.format("🌍 %s, research local investment options and tax-advantaged accounts in %s!", userName, region));
        }
        
        // Clean and format fallback tips to prevent character corruption
        List<String> cleanedTips = fallbackTips.stream()
            .map(this::cleanAndFormatTip)
            .collect(Collectors.toList());
        
        return cleanedTips.subList(0, Math.min(cleanedTips.size(), 3));
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
                case CRYPTO -> "Use South African platforms like Luno, VALR, or AltCoinTrader for crypto investments. Be aware of SARS crypto tax implications.";
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
                case CRYPTO -> "Use established exchanges like Coinbase, Kraken, or Gemini. Be aware of IRS crypto tax reporting requirements.";
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
                case CRYPTO -> "Use regulated exchanges like Bitstamp, Bitpanda, or eToro. Follow MiCA regulations for crypto investments in EU.";
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
                case CRYPTO -> "Use FCA-regulated platforms like Coinbase Pro, Binance UK, or Crypto.com. Consider capital gains tax implications.";
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
                case CRYPTO -> "Use reputable crypto exchanges, enable 2FA security, and research local tax regulations for cryptocurrency.";
                case OTHER -> "Compare local options and look for seasonal deals in your area.";
            };
        }
    }
    
    private String getSpendingAdviceForRegion(String region, String currency) {
        return switch (region) {
            case "South Africa" -> "Use FinSight AI's expense tracking and budgeting features to monitor your ZAR spending effectively.";
            case "United States" -> "Leverage FinSight AI's comprehensive tracking tools to monitor your USD spending and identify savings opportunities.";
            case "Europe" -> "Take advantage of FinSight AI's budgeting features to track your EUR expenses and optimize spending patterns.";
            case "United Kingdom" -> "Use FinSight AI's expense categorization and budget tracking for effective GBP financial management.";
            default -> String.format("Use FinSight AI's powerful tracking and budgeting tools to monitor your %s spending effectively.", currency);
        };
    }
    
    private String getRecentSpendingAdvice(String region, String currency) {
        return switch (region) {
            case "South Africa" -> "Keep receipts for tax deductions and use FinSight AI's expense tracking to categorize your spending.";
            case "United States" -> "Track receipts for tax purposes and use FinSight AI's budgeting tools to monitor your financial progress.";
            case "Europe" -> "Keep receipts for VAT purposes and leverage FinSight AI's spending insights and budget features.";
            case "United Kingdom" -> "Save receipts for expenses and use FinSight AI's categorization and budgeting tools for better control.";
            default -> String.format("Review your spending patterns using FinSight AI's analytics and optimize your %s budget.", currency);
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
                case CRYPTO -> "Pause crypto purchases temporarily and avoid FOMO trading during overspending months.";
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
                case CRYPTO -> "Pause crypto investments and avoid emotional trading when overspending.";
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
                case CRYPTO -> "Temporarily halt crypto purchases and focus on regulated EU platforms when resuming.";
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
                case CRYPTO -> "Pause crypto trading and stick to FCA-regulated platforms when you resume.";
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
                case CRYPTO -> "Take a break from crypto purchases and avoid emotional trading during overspending periods.";
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
                case CRYPTO -> "Good restraint! Consider using savings for dollar-cost averaging into established cryptocurrencies.";
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
                case CRYPTO -> "Great discipline! Consider dollar-cost averaging into Bitcoin or Ethereum with your savings.";
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
                case CRYPTO -> "Good control! Consider investing savings in regulated EU crypto platforms with proper diversification.";
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
                case CRYPTO -> "Excellent discipline! Consider allocating savings to FCA-regulated crypto platforms for diversification.";
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
                case CRYPTO -> "Great self-control! Consider using the savings for dollar-cost averaging into established cryptocurrencies.";
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
                case CRYPTO -> "Monitor crypto investments carefully - avoid FOMO purchases and stick to your plan.";
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
                case CRYPTO -> "Monitor crypto investments - avoid impulsive trades and stick to your DCA plan.";
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
                case CRYPTO -> "Watch crypto spending carefully - stick to regulated EU platforms and avoid impulsive trades.";
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
                case CRYPTO -> "Monitor crypto investments - use FCA-regulated platforms and avoid emotional decisions.";
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
                case CRYPTO -> "Watch crypto spending - avoid FOMO and stick to your investment plan.";
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
                case CRYPTO -> "Dollar-cost average with small amounts monthly rather than large one-time purchases. Keep emergency fund intact.";
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
                case CRYPTO -> "Start with dollar-cost averaging small amounts into Bitcoin/Ethereum. Don't invest more than 5-10% of portfolio.";
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
                case CRYPTO -> "Start with small amounts using dollar-cost averaging. Research projects thoroughly and never invest more than you can afford to lose.";
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
                case CRYPTO -> "Smart crypto budgeting! Continue dollar-cost averaging and consider researching altcoins with strong use cases.";
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
                case CRYPTO -> "Good crypto allocation! Continue with disciplined investing and consider taking some profits during bull markets.";
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
                case CRYPTO -> "Pause all crypto purchases immediately until you're back on budget. Focus on essentials first.";
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
                case CRYPTO -> "Stop all crypto purchases until budget is under control. Prioritize emergency fund and debt repayment.";
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
                case CRYPTO -> String.format("Consider dollar-cost averaging this %s %.2f into Bitcoin or Ethereum via Luno/VALR - start small!", currency, savings);
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
                case CRYPTO -> String.format("Consider dollar-cost averaging this %s %.2f into established cryptocurrencies for long-term growth!", currency, savings);
                case OTHER -> String.format("Put this %s %.2f towards your highest priority financial goal!", currency, savings);
            };
        }
    }
    
    // Generate contextual AI response for user questions/statements
    public String generateContextualResponse(User user, String userMessage) {
        logger.info("Generating contextual AI response for user: {}", user.getFirebaseUid());
        
        try {
            // Get comprehensive financial context
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
            LocalDate startOfYear = now.withDayOfYear(1);
            
            List<Expense> currentMonthExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Expense> currentYearExpenses = expenseService.getUserExpensesByDateRange(user, startOfYear, now);
            List<Budget> currentMonthBudgets = budgetService.getUserBudgetsByMonth(user, now.getMonthValue(), now.getYear());
            Map<ExpenseCategory, BigDecimal> categorySpending = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
            
            // Create comprehensive context with database schema info
            StringBuilder contextPrompt = new StringBuilder();
            
            String currency = user.getCurrency();
            String currencySymbol = formatCurrencySymbol(currency);
            String region = getCurrencyLocation(currency);
            String firstName = user.getFirstName() != null ? user.getFirstName() : "User";
            
            // Add database schema context for AI to understand data structure
            contextPrompt.append("Database Schema Context:\n");
            contextPrompt.append("EXPENSES table: id, user_id, amount, category, description, date, receipt_url, notes\n");
            contextPrompt.append("BUDGETS table: id, user_id, category, monthly_limit, current_spent, month, year\n");
            contextPrompt.append("CATEGORIES: ").append(Arrays.stream(ExpenseCategory.values())
                .map(ExpenseCategory::getDisplayName)
                .collect(Collectors.joining(", "))).append("\n\n");
            
            // Add app capabilities context so AI knows what features are available
            contextPrompt.append("APP CAPABILITIES - FinSight AI includes these built-in features:\n");
            contextPrompt.append("- Expense tracking with categories and receipt scanning\n");
            contextPrompt.append("- Budget creation and monitoring with real-time progress\n");
            contextPrompt.append("- Financial reports and analytics\n");
            contextPrompt.append("- AI-powered financial tips and insights\n");
            contextPrompt.append("- Interactive chatbot for financial advice\n");
            contextPrompt.append("- Mobile app with offline capabilities\n");
            contextPrompt.append("- Data export (PDF/CSV) for external analysis\n");
            contextPrompt.append("- Multi-currency support and regional financial advice\n\n");
            contextPrompt.append("IMPORTANT: Do NOT suggest using external apps, spreadsheets, or other tools for tracking expenses or budgets. This app already provides all these features.\n\n");
            
            // Add user financial context
            contextPrompt.append("User: ").append(firstName).append(" (").append(region).append(")\n");
            contextPrompt.append("Currency: ").append(currencySymbol).append("\n");
            
            // Add spending summary
            BigDecimal totalSpentMonth = currentMonthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalSpentYear = currentYearExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            contextPrompt.append("This month spent: ").append(currencySymbol).append(String.format("%.2f", totalSpentMonth));
            contextPrompt.append(" (").append(currentMonthExpenses.size()).append(" transactions)\n");
            contextPrompt.append("This year spent: ").append(currencySymbol).append(String.format("%.2f", totalSpentYear));
            contextPrompt.append(" (").append(currentYearExpenses.size()).append(" transactions)\n");
            
            // Add recent transactions with descriptions for context
            contextPrompt.append("\nRecent transactions (last 5):\n");
            currentMonthExpenses.stream()
                .sorted((e1, e2) -> e2.getDate().compareTo(e1.getDate()))
                .limit(5)
                .forEach(expense -> {
                    contextPrompt.append("- ").append(currencySymbol).append(String.format("%.2f", expense.getAmount()))
                        .append(" on ").append(expense.getCategory().getDisplayName());
                    if (expense.getDescription() != null && !expense.getDescription().trim().isEmpty()) {
                        contextPrompt.append(" (").append(expense.getDescription()).append(")");
                    }
                    contextPrompt.append(" on ").append(expense.getDate()).append("\n");
                });
            
            // Add budget information
            if (!currentMonthBudgets.isEmpty()) {
                contextPrompt.append("\nBudgets this month:\n");
                for (Budget budget : currentMonthBudgets) {
                    BigDecimal spent = categorySpending.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
                    double percentage = spent.divide(budget.getMonthlyLimit(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();
                    contextPrompt.append("- ").append(budget.getCategory().getDisplayName()).append(": ")
                        .append(currencySymbol).append(String.format("%.2f", spent))
                        .append("/").append(currencySymbol).append(String.format("%.2f", budget.getMonthlyLimit()))
                        .append(" (").append(String.format("%.0f", percentage)).append("%)\n");
                }
            }
            
            // Add top spending categories
            if (!categorySpending.isEmpty()) {
                contextPrompt.append("\nTop spending categories this month:\n");
                categorySpending.entrySet().stream()
                    .sorted(Map.Entry.<ExpenseCategory, BigDecimal>comparingByValue().reversed())
                    .limit(3)
                    .forEach(entry -> {
                        contextPrompt.append("- ").append(entry.getKey().getDisplayName())
                            .append(": ").append(currencySymbol).append(String.format("%.2f", entry.getValue())).append("\n");
                    });
            }
            
            // Add the user's question/statement
            contextPrompt.append("\nUser Question/Statement: \"").append(userMessage).append("\"\n\n");
            
            // Instructions for AI
            contextPrompt.append("Instructions: Analyze the user's question/statement and provide a helpful, personalized response. ");
            contextPrompt.append("If they're asking about spending patterns, amounts, or transactions, reference the actual data above. ");
            contextPrompt.append("If they mention a specific purchase or ask for advice, provide thoughtful financial guidance. ");
            contextPrompt.append("If you need to query specific data beyond what's provided, suggest what additional information would be helpful. ");
            contextPrompt.append("Keep response under 200 words, conversational, and practical. No markdown formatting.");
            
            String aiResponse = callAIAgentAPI(contextPrompt.toString());
            
            if (aiResponse != null && !aiResponse.trim().isEmpty()) {
                String processedResponse = processContextualAIResponse(aiResponse, currency);
                if (processedResponse != null && processedResponse.length() > 15) {
                    logger.info("Successfully generated contextual AI response for user: {}", user.getFirebaseUid());
                    return processedResponse;
                }
            }
            
        } catch (Exception e) {
            logger.warn("Failed to generate contextual AI response for user {}: {}", user.getFirebaseUid(), e.getMessage());
        }
        
        // Fallback response
        return "I understand you're asking about your finances, but I'm having trouble processing that right now. Try asking about specific amounts, categories, or time periods, like 'How much did I spend on groceries last month?'";
    }
    
    // Process contextual AI response for optimal user presentation
    private String processContextualAIResponse(String aiResponse, String currency) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return null;
        }
        
        // Clean up character encoding and formatting issues
        String cleanedResponse = aiResponse
            .replaceAll("ΓÇ[£¥ô]", "\"")     // Fix various quote characters
            .replaceAll("ΓÇ[æ–—]", "-")      // Fix various dash characters  
            .replaceAll("ΓÇ[»¿•]", "")       // Remove bullet/weird characters
            .replaceAll("ΓÇÖ", "'")          // Fix apostrophes
            .replaceAll("ΓÇô", "-")          // Fix en-dashes
            .replaceAll("ΓëêΓÇ»", "~")       // Fix approximation symbols
            .replaceAll("ΓÇæ", "-")          // Fix hyphen corruption
            .replaceAll("ΓÇ»", "")           // Remove percent symbol corruption
            .replaceAll("\\*\\*[^*]*\\*\\*", "") // Remove **bold text**
            .replaceAll("\\*[^*]*\\*", "")       // Remove *italic text*
            .replaceAll("\\*+", "")              // Remove any remaining asterisks
            .replaceAll("\\\\u201[CD]", "\"")      // Smart quotes
            .replaceAll("\\\\u201[89]", "'")       // Single quotes
            .replaceAll("\\\\u201[3-4]", "-")      // En/Em dashes
            .replaceAll("\\u00A0", " ")          // Non-breaking space
            .replaceAll("≡ƒ[\\w]*", "")          // Remove emoji corruption symbols
            .replaceAll("Γ[\\w]*", "")           // Remove other corruption
            .replaceAll("\\s+", " ")             // Normalize whitespace
            .trim();
        
        // Remove common AI prefixes and formatting
        cleanedResponse = cleanedResponse
            .replaceAll("(?i)^(based on your|looking at your|according to your).*?(data|expenses|spending)[,:]?\\s*", "")
            .replaceAll("(?i)^(here's what i found|here's my analysis|my response):?\\s*", "")
            .replaceAll("(?i)^(analyzing your|reviewing your).*?[,:]\\s*", "")
            .replaceAll("(?i)(hope this helps|let me know|feel free to ask).*$", "")
            .replaceAll("^[\"'`]|[\"'`]$", "")  // Remove surrounding quotes/backticks
            .trim();
        
        // Only truncate if response is extremely long (over 500 chars)
        if (cleanedResponse.length() > 500) {
            // Find a good breaking point at sentence boundaries
            String[] sentences = cleanedResponse.split("(?<=[.!?])\\s+");
            StringBuilder result = new StringBuilder();
            for (String sentence : sentences) {
                if (result.length() + sentence.length() + 1 <= 450) {
                    if (result.length() > 0) result.append(" ");
                    result.append(sentence.trim());
                } else {
                    break;
                }
            }
            if (result.length() > 0) {
                cleanedResponse = result.toString();
                // Ensure proper ending
                if (!cleanedResponse.endsWith(".") && !cleanedResponse.endsWith("!") && !cleanedResponse.endsWith("?")) {
                    cleanedResponse += ".";
                }
            } else {
                cleanedResponse = cleanedResponse.substring(0, 450).trim() + "...";
            }
        }
        
        // Reject if too short or contains formatting issues
        if (cleanedResponse.length() < 20 || cleanedResponse.contains("ΓÇ")) {
            return null;
        }
        
        // Ensure proper ending
        if (!cleanedResponse.endsWith(".") && !cleanedResponse.endsWith("!") && !cleanedResponse.endsWith("?")) {
            cleanedResponse += ".";
        }
        
        // Apply currency formatting
        String formattedResponse = formatTipText(cleanedResponse, currency);
        
        logger.debug("Processed contextual AI response: {}", formattedResponse);
        return formattedResponse;
    }
}