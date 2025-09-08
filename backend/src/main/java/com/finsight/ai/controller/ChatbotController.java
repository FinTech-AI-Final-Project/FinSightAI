package com.finsight.ai.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.Expense;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import com.finsight.ai.service.ChatbotService;
import com.finsight.ai.service.BudgetService;
import com.finsight.ai.service.ExpenseService;
import com.finsight.ai.service.FirebaseAuthService;
import com.finsight.ai.service.UserService;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/ai-chatbot")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;
    
    @Autowired
    private FirebaseAuthService firebaseAuthService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ExpenseService expenseService;
    
    @Autowired
    private BudgetService budgetService;

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> payload) {
        
        try {
            // Extract and verify Firebase token
            String token = authHeader.replace("Bearer ", "");
            FirebaseToken firebaseToken = firebaseAuthService.verifyToken(token);
            
            if (firebaseToken == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
            }
            
            String firebaseUid = firebaseToken.getUid();
            
            // Get user from database
            Optional<User> userOptional = userService.getUserByFirebaseUid(firebaseUid);
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            User user = userOptional.get();
            
            // Extract request data
            String userMessage = (String) payload.get("message");
            String currency = (String) payload.getOrDefault("currency", "ZAR");
            String region = (String) payload.getOrDefault("region", "ZA");
            
            // Get comprehensive financial data from PostgreSQL database
            LocalDate currentDate = LocalDate.now();
            LocalDate startOfMonth = currentDate.withDayOfMonth(1);
            LocalDate endOfMonth = currentDate.withDayOfMonth(currentDate.lengthOfMonth());
            
            // Get last 6 months for comprehensive historical context
            LocalDate sixMonthsAgo = currentDate.minusMonths(6);
            
            // Fetch ALL user's financial data for comprehensive context
            List<Expense> allExpenses = expenseService.getUserExpenses(user);
            List<Expense> recentExpenses = expenseService.getUserExpensesByDateRange(user, startOfMonth, endOfMonth);
            List<Expense> last6MonthsExpenses = expenseService.getUserExpensesByDateRange(user, sixMonthsAgo, currentDate);
            
            // Get all budgets for current and recent months
            List<Budget> currentBudgets = budgetService.getUserBudgetsByMonth(user, currentDate.getMonthValue(), currentDate.getYear());
            List<Budget> allUserBudgets = budgetService.getUserBudgets(user);
            
            // Calculate comprehensive financial statistics
            BigDecimal totalSpentThisMonth = expenseService.getTotalExpenses(user, startOfMonth, endOfMonth);
            BigDecimal totalSpentLast6Months = expenseService.getTotalExpenses(user, sixMonthsAgo, currentDate);
            BigDecimal totalAllTimeSpending = allExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get spending by category for current month
            Map<ExpenseCategory, BigDecimal> currentMonthByCategory = expenseService.getExpensesByCategory(user, startOfMonth, endOfMonth);
            
            // Calculate budget utilization
            BigDecimal totalCurrentBudget = currentBudgets.stream()
                .map(Budget::getMonthlyLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get previous month for comparison
            LocalDate lastMonth = currentDate.minusMonths(1);
            LocalDate lastMonthStart = lastMonth.withDayOfMonth(1);
            LocalDate lastMonthEnd = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            BigDecimal totalSpentLastMonth = expenseService.getTotalExpenses(user, lastMonthStart, lastMonthEnd);
            
            // Calculate averages and trends
            double monthlyAverage = last6MonthsExpenses.isEmpty() ? 0.0 : 
                totalSpentLast6Months.divide(BigDecimal.valueOf(6), 2, BigDecimal.ROUND_HALF_UP).doubleValue();
            
            // Create comprehensive context for AI with ALL database information
            Map<String, Object> aiContext = new HashMap<>();
            aiContext.put("message", userMessage);
            aiContext.put("currency", currency);
            aiContext.put("region", region);
            aiContext.put("userFirstName", user.getFirstName());
            
            // Current month data
            aiContext.put("currentMonth", currentDate.getMonth().toString());
            aiContext.put("currentYear", currentDate.getYear());
            aiContext.put("totalSpentThisMonth", totalSpentThisMonth);
            aiContext.put("totalCurrentBudget", totalCurrentBudget);
            aiContext.put("expenseCountThisMonth", recentExpenses.size());
            aiContext.put("budgetCount", currentBudgets.size());
            
            // Historical data
            aiContext.put("totalSpentLastMonth", totalSpentLastMonth);
            aiContext.put("totalSpentLast6Months", totalSpentLast6Months);
            aiContext.put("totalAllTimeSpending", totalAllTimeSpending);
            aiContext.put("totalExpenseCount", allExpenses.size());
            aiContext.put("monthlyAverage", BigDecimal.valueOf(monthlyAverage));
            
            // Category breakdown
            aiContext.put("categoryBreakdown", currentMonthByCategory);
            
            // Budget information
            aiContext.put("totalBudgets", allUserBudgets.size());
            
            // Add specific month context
            aiContext.put("lastMonth", lastMonth.getMonth().toString());
            aiContext.put("lastMonthYear", lastMonth.getYear());
            
            // Get AI response using chatbot service
            String aiReply = chatbotService.getChatbotReply(aiContext);
            
            return ResponseEntity.ok(Map.of("reply", aiReply));
            
        } catch (Exception e) {
            System.err.println("Chatbot error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to process chat request: " + e.getMessage()));
        }
    }
    
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}
