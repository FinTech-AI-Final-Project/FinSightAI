package com.finsight.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ChatbotService {

    private static final Logger logger = LoggerFactory.getLogger(ChatbotService.class);

    @Value("${gradient.ai.agent.api.url}")
    private String aiAgentApiUrl;

    @Value("${gradient.ai.agent.api.key}")
    private String aiAgentApiKey;

    @Autowired
    private CurrencyService currencyService;

    private final WebClient webClient;

    public ChatbotService() {
        this.webClient = WebClient.builder().build();
    }

    /**
     * Get AI chatbot reply with user context and financial data
     */
    public String getChatbotReply(Map<String, Object> context) {
        try {
            String userMessage = (String) context.get("message");
            String currency = (String) context.get("currency");
            String region = (String) context.get("region");
            String userFirstName = (String) context.get("userFirstName");
            
            // Current month data
            String currentMonth = (String) context.get("currentMonth");
            Integer currentYear = (Integer) context.get("currentYear");
            BigDecimal totalSpentThisMonthBD = (BigDecimal) context.get("totalSpentThisMonth");
            BigDecimal totalCurrentBudgetBD = (BigDecimal) context.get("totalCurrentBudget");
            Integer expenseCountThisMonth = (Integer) context.get("expenseCountThisMonth");
            Integer budgetCount = (Integer) context.get("budgetCount");
            
            // Historical data
            BigDecimal totalSpentLastMonthBD = (BigDecimal) context.get("totalSpentLastMonth");
            BigDecimal totalSpentLast6MonthsBD = (BigDecimal) context.get("totalSpentLast6Months");
            BigDecimal totalAllTimeSpendingBD = (BigDecimal) context.get("totalAllTimeSpending");
            Integer totalExpenseCount = (Integer) context.get("totalExpenseCount");
            BigDecimal monthlyAverageBD = (BigDecimal) context.get("monthlyAverage");
            Integer totalBudgets = (Integer) context.get("totalBudgets");
            
            String lastMonth = (String) context.get("lastMonth");
            Integer lastMonthYear = (Integer) context.get("lastMonthYear");

            // Convert BigDecimal to double for formatting
            double totalSpentThisMonth = totalSpentThisMonthBD != null ? totalSpentThisMonthBD.doubleValue() : 0.0;
            double totalCurrentBudget = totalCurrentBudgetBD != null ? totalCurrentBudgetBD.doubleValue() : 0.0;
            double totalSpentLastMonth = totalSpentLastMonthBD != null ? totalSpentLastMonthBD.doubleValue() : 0.0;
            double totalSpentLast6Months = totalSpentLast6MonthsBD != null ? totalSpentLast6MonthsBD.doubleValue() : 0.0;
            double totalAllTimeSpending = totalAllTimeSpendingBD != null ? totalAllTimeSpendingBD.doubleValue() : 0.0;
            double monthlyAverage = monthlyAverageBD != null ? monthlyAverageBD.doubleValue() : 0.0;

            // Format currency amounts with proper symbols
            String formattedThisMonthSpent = currencyService.formatAmount(totalSpentThisMonth, currency);
            String formattedCurrentBudget = currencyService.formatAmount(totalCurrentBudget, currency);
            String formattedLastMonthSpent = currencyService.formatAmount(totalSpentLastMonth, currency);
            String formattedMonthlyAverage = currencyService.formatAmount(monthlyAverage, currency);

            // Create user-friendly prompt optimized for chat responses
            String contextualPrompt = String.format(
                "You are FinSight AI, a helpful financial advisor. Keep responses short and friendly. " +
                "User: %s from %s using %s. " +
                "This month spent: %s of %s budget. " +
                "Question: '%s' " +
                "Answer briefly with specific advice based on their data.",
                userFirstName, region, currency, 
                formattedThisMonthSpent, formattedCurrentBudget,
                userMessage
            );

            // Call the AI agent with contextual prompt
            try {
                Map<String, Object> requestBody = new HashMap<>();
                List<Map<String, String>> messages = new ArrayList<>();

                Map<String, String> messageObj = new HashMap<>();
                messageObj.put("role", "user");
                messageObj.put("content", contextualPrompt);
                messages.add(messageObj);

                requestBody.put("messages", messages);
                requestBody.put("max_tokens", 100);
                requestBody.put("temperature", 0.7);

                logger.info("Making chatbot API call to: {}", aiAgentApiUrl);

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
                        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                        String aiResponse = (String) message.get("content");

                        logger.info("Chatbot AI response received: {}", aiResponse != null ? aiResponse.length() + " characters" : "null");

                        if (aiResponse != null && !aiResponse.trim().isEmpty()) {
                            return aiResponse.trim();
                        }
                    }
                }

                logger.warn("Chatbot AI response was empty or invalid");

            } catch (Exception e) {
                logger.error("Error calling AI agent for chatbot: {}", e.getMessage());
            }

            return String.format("Hi %s! 👋 I'd be happy to help with your finances. Could you rephrase your question?", userFirstName);

        } catch (Exception e) {
            logger.error("Error getting chatbot reply", e);
            return "I'm having trouble right now 😅 Please try again in a moment!";
        }
    }
}
