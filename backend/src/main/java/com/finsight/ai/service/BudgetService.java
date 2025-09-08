package com.finsight.ai.service;

import com.finsight.ai.dto.BudgetDto;
import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import com.finsight.ai.repository.BudgetRepository;
import com.finsight.ai.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    public Budget createBudget(BudgetDto budgetDto, User user) {
        // Check if budget already exists for this category, month, and year
        Optional<Budget> existingBudget = budgetRepository.findByUserAndCategoryAndMonthAndYear(
            user, budgetDto.getCategory(), budgetDto.getMonth(), budgetDto.getYear());

        if (existingBudget.isPresent()) {
            throw new RuntimeException("Budget already exists for this category and month");
        }

        Budget budget = new Budget(
            budgetDto.getCategory(),
            budgetDto.getMonthlyLimit(),
            budgetDto.getMonth(),
            budgetDto.getYear(),
            user
        );

        // Calculate current spent amount
        updateBudgetSpent(budget);

        return budgetRepository.save(budget);
    }

    public List<Budget> getUserBudgets(User user) {
        return budgetRepository.findByUserOrderByCategory(user);
    }

    public List<Budget> getUserBudgetsByMonth(User user, Integer month, Integer year) {
        return budgetRepository.findByUserAndMonthAndYearOrderByCategory(user, month, year);
    }

    public Budget updateBudget(Long budgetId, BudgetDto budgetDto, User user) {
        Budget budget = budgetRepository.findById(budgetId)
            .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to update this budget");
        }

        budget.setCategory(budgetDto.getCategory());
        budget.setMonthlyLimit(budgetDto.getMonthlyLimit());
        budget.setMonth(budgetDto.getMonth());
        budget.setYear(budgetDto.getYear());

        // Recalculate current spent amount
        updateBudgetSpent(budget);

        return budgetRepository.save(budget);
    }

    public void deleteBudget(Long budgetId, User user) {
        Budget budget = budgetRepository.findById(budgetId)
            .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this budget");
        }

        budgetRepository.delete(budget);
    }

    public void updateBudgetSpent(User user, ExpenseCategory category, LocalDate expenseDate) {
        int month = expenseDate.getMonthValue();
        int year = expenseDate.getYear();

        Optional<Budget> budgetOpt = budgetRepository.findByUserAndCategoryAndMonthAndYear(
            user, category, month, year);

        if (budgetOpt.isPresent()) {
            Budget budget = budgetOpt.get();
            updateBudgetSpent(budget);
            budgetRepository.save(budget);
        }
    }

    private void updateBudgetSpent(Budget budget) {
        LocalDate startDate = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        BigDecimal spent = expenseRepository.getTotalExpensesByCategoryBetweenDates(
            budget.getUser(), budget.getCategory(), startDate, endDate);

        budget.setCurrentSpent(spent != null ? spent : BigDecimal.ZERO);
    }

    public BudgetDto convertToDto(Budget budget) {
        BudgetDto dto = new BudgetDto();
        dto.setId(budget.getId());
        dto.setCategory(budget.getCategory());
        dto.setMonthlyLimit(budget.getMonthlyLimit());
        dto.setMonth(budget.getMonth());
        dto.setYear(budget.getYear());
        dto.setCurrentSpent(budget.getCurrentSpent());
        dto.setRemainingBudget(budget.getRemainingBudget());
        dto.setBudgetPercentage(budget.getBudgetPercentage());
        dto.setIsOverBudget(budget.isOverBudget());
        return dto;
    }
}
