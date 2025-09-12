package com.finsight.ai.service;

import com.finsight.ai.dto.ExpenseDto;
import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.Expense;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.RecurringExpense;
import com.finsight.ai.entity.User;
import com.finsight.ai.repository.BudgetRepository;
import com.finsight.ai.repository.ExpenseRepository;
import com.finsight.ai.repository.RecurringExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private BudgetService budgetService;

    public Expense createExpense(ExpenseDto expenseDto, User user) {
        // Check if budget exists for this category, month, and year
        LocalDate expenseDate = expenseDto.getDate();
        Optional<Budget> budgetOpt = budgetRepository.findByUserAndCategoryAndMonthAndYear(
            user, 
            expenseDto.getCategory(), 
            expenseDate.getMonthValue(), 
            expenseDate.getYear()
        );
        
        if (budgetOpt.isEmpty()) {
            String categoryName = expenseDto.getCategory().getDisplayName();
            String monthName = expenseDate.getMonth().name();
            throw new IllegalArgumentException(
                String.format("You must create a budget for %s in %s %d before adding expenses to this category.", 
                    categoryName, monthName, expenseDate.getYear())
            );
        }
        
        Expense expense = new Expense(
            expenseDto.getDescription(),
            expenseDto.getAmount(),
            expenseDto.getCategory(),
            expenseDto.getDate(),
            user
        );

        expense.setReceiptUrl(expenseDto.getReceiptUrl());
        
        // Validate and truncate notes if too long (max 1000 characters)
        String notes = expenseDto.getNotes();
        if (notes != null && notes.length() > 1000) {
            notes = notes.substring(0, 997) + "...";
        }
        expense.setNotes(notes);

        if (expenseDto.getRecurringExpenseId() != null) {
            RecurringExpense recurringExpense = recurringExpenseRepository
                .findById(expenseDto.getRecurringExpenseId())
                .orElse(null);
            expense.setRecurringExpense(recurringExpense);
        }

        Expense savedExpense = expenseRepository.save(expense);

        // Update budget spent amount
        budgetService.updateBudgetSpent(user, expenseDto.getCategory(), expenseDto.getDate());

        return savedExpense;
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUserOrderByDateDesc(user);
    }

    public List<Expense> getUserExpensesByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserAndDateBetweenOrderByDateDesc(user, startDate, endDate);
    }

    public List<Expense> getUserExpensesByCategory(User user, ExpenseCategory category) {
        return expenseRepository.findByUserAndCategoryOrderByDateDesc(user, category);
    }

    public List<Expense> getUserExpensesByCategoryAndDateRange(User user, ExpenseCategory category, 
                                                             LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByUserAndCategoryAndDateBetweenOrderByDateDesc(
            user, category, startDate, endDate);
    }

    public Expense updateExpense(Long expenseId, ExpenseDto expenseDto, User user) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to update this expense");
        }

        expense.setDescription(expenseDto.getDescription());
        expense.setAmount(expenseDto.getAmount());
        expense.setCategory(expenseDto.getCategory());
        expense.setDate(expenseDto.getDate());
        expense.setReceiptUrl(expenseDto.getReceiptUrl());
        expense.setNotes(expenseDto.getNotes());

        Expense savedExpense = expenseRepository.save(expense);

        // Update budget spent amount
        budgetService.updateBudgetSpent(user, expenseDto.getCategory(), expenseDto.getDate());

        return savedExpense;
    }

    public void deleteExpense(Long expenseId, User user) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this expense");
        }

        ExpenseCategory category = expense.getCategory();
        LocalDate date = expense.getDate();

        expenseRepository.delete(expense);

        // Update budget spent amount
        budgetService.updateBudgetSpent(user, category, date);
    }

    public BigDecimal getTotalExpenses(User user, LocalDate startDate, LocalDate endDate) {
        BigDecimal total = expenseRepository.getTotalExpensesBetweenDates(user, startDate, endDate);
        return total != null ? total : BigDecimal.ZERO;
    }

    public Map<ExpenseCategory, BigDecimal> getExpensesByCategory(User user, LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = expenseRepository.getExpensesByCategoryBetweenDates(user, startDate, endDate);
        return results.stream()
            .collect(Collectors.toMap(
                result -> (ExpenseCategory) result[0],
                result -> (BigDecimal) result[1]
            ));
    }

    public Map<LocalDate, BigDecimal> getDailyExpenses(User user, LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = expenseRepository.getDailyExpensesBetweenDates(user, startDate, endDate);
        return results.stream()
            .collect(Collectors.toMap(
                result -> (LocalDate) result[0],
                result -> (BigDecimal) result[1]
            ));
    }
}
