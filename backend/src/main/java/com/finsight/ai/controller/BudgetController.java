package com.finsight.ai.controller;

import com.finsight.ai.dto.BudgetDto;
import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.User;
import com.finsight.ai.service.BudgetService;
import com.finsight.ai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/budgets")
@CrossOrigin(origins = "*")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createBudget(@RequestHeader("Authorization") String authToken,
                                        @Valid @RequestBody BudgetDto budgetDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Budget budget = budgetService.createBudget(budgetDto, user);
            BudgetDto responseDto = budgetService.convertToDto(budget);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserBudgets(@RequestHeader("Authorization") String authToken,
                                          @RequestParam(required = false) Integer month,
                                          @RequestParam(required = false) Integer year) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);

            List<Budget> budgets;
            if (month != null && year != null) {
                budgets = budgetService.getUserBudgetsByMonth(user, month, year);
            } else {
                budgets = budgetService.getUserBudgets(user);
            }

            List<BudgetDto> budgetDtos = budgets.stream()
                .map(budgetService::convertToDto)
                .collect(Collectors.toList());

            return ResponseEntity.ok(budgetDtos);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{budgetId}")
    public ResponseEntity<?> updateBudget(@RequestHeader("Authorization") String authToken,
                                        @PathVariable Long budgetId,
                                        @Valid @RequestBody BudgetDto budgetDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            Budget budget = budgetService.updateBudget(budgetId, budgetDto, user);
            BudgetDto responseDto = budgetService.convertToDto(budget);
            return ResponseEntity.ok(responseDto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<?> deleteBudget(@RequestHeader("Authorization") String authToken,
                                        @PathVariable Long budgetId) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            budgetService.deleteBudget(budgetId, user);
            return ResponseEntity.ok("Budget deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
