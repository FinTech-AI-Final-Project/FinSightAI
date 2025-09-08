package com.finsight.ai.dto;

import com.finsight.ai.entity.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class BudgetDto {
    private Long id;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    @NotNull(message = "Monthly limit is required")
    @DecimalMin(value = "0.01", message = "Monthly limit must be greater than 0")
    private BigDecimal monthlyLimit;

    @NotNull(message = "Month is required")
    private Integer month;

    @NotNull(message = "Year is required")
    private Integer year;

    private BigDecimal currentSpent;
    private BigDecimal remainingBudget;
    private Double budgetPercentage;
    private Boolean isOverBudget;

    public BudgetDto() {}

    public BudgetDto(ExpenseCategory category, BigDecimal monthlyLimit, Integer month, Integer year) {
        this.category = category;
        this.monthlyLimit = monthlyLimit;
        this.month = month;
        this.year = year;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(ExpenseCategory category) {
        this.category = category;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(BigDecimal monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getCurrentSpent() {
        return currentSpent;
    }

    public void setCurrentSpent(BigDecimal currentSpent) {
        this.currentSpent = currentSpent;
    }

    public BigDecimal getRemainingBudget() {
        return remainingBudget;
    }

    public void setRemainingBudget(BigDecimal remainingBudget) {
        this.remainingBudget = remainingBudget;
    }

    public Double getBudgetPercentage() {
        return budgetPercentage;
    }

    public void setBudgetPercentage(Double budgetPercentage) {
        this.budgetPercentage = budgetPercentage;
    }

    public Boolean getIsOverBudget() {
        return isOverBudget;
    }

    public void setIsOverBudget(Boolean isOverBudget) {
        this.isOverBudget = isOverBudget;
    }
}
