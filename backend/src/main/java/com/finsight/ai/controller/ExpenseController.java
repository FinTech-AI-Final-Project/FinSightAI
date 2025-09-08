package com.finsight.ai.controller;

import com.finsight.ai.dto.ExpenseDto;
import com.finsight.ai.entity.Expense;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import com.finsight.ai.service.ExpenseService;
import com.finsight.ai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestHeader("Authorization") String authToken,
                                         @Valid @RequestBody ExpenseDto expenseDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Expense expense = expenseService.createExpense(expenseDto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(expense);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserExpenses(@RequestHeader("Authorization") String authToken,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                           @RequestParam(required = false) ExpenseCategory category) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);

            List<Expense> expenses;
            if (startDate != null && endDate != null && category != null) {
                expenses = expenseService.getUserExpensesByCategoryAndDateRange(user, category, startDate, endDate);
            } else if (startDate != null && endDate != null) {
                expenses = expenseService.getUserExpensesByDateRange(user, startDate, endDate);
            } else if (category != null) {
                expenses = expenseService.getUserExpensesByCategory(user, category);
            } else {
                expenses = expenseService.getUserExpenses(user);
            }

            return ResponseEntity.ok(expenses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<?> getExpense(@RequestHeader("Authorization") String authToken,
                                      @PathVariable Long expenseId) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            
            // Find expense and check ownership - implementation would go in service
            List<Expense> userExpenses = expenseService.getUserExpenses(user);
            Expense expense = userExpenses.stream()
                .filter(e -> e.getId().equals(expenseId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Expense not found"));

            return ResponseEntity.ok(expense);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<?> updateExpense(@RequestHeader("Authorization") String authToken,
                                         @PathVariable Long expenseId,
                                         @Valid @RequestBody ExpenseDto expenseDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Expense expense = expenseService.updateExpense(expenseId, expenseDto, user);
            return ResponseEntity.ok(expense);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<?> deleteExpense(@RequestHeader("Authorization") String authToken,
                                         @PathVariable Long expenseId) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            expenseService.deleteExpense(expenseId, user);
            return ResponseEntity.ok("Expense deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/total")
    public ResponseEntity<?> getTotalExpenses(@RequestHeader("Authorization") String authToken,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            BigDecimal total = expenseService.getTotalExpenses(user, startDate, endDate);
            return ResponseEntity.ok(Map.of("total", total));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/by-category")
    public ResponseEntity<?> getExpensesByCategory(@RequestHeader("Authorization") String authToken,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Map<ExpenseCategory, BigDecimal> expenses = expenseService.getExpensesByCategory(user, startDate, endDate);
            return ResponseEntity.ok(expenses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyExpenses(@RequestHeader("Authorization") String authToken,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Map<LocalDate, BigDecimal> expenses = expenseService.getDailyExpenses(user, startDate, endDate);
            return ResponseEntity.ok(expenses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
