package com.finsight.ai.config;

import com.finsight.ai.entity.*;
import com.finsight.ai.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    @Override
    public void run(String... args) throws Exception {
        // Commented out sample data seeding to allow real user registration
        // if (userRepository.count() == 0) {
        //     seedData();
        // }
        System.out.println("DataSeeder: Skipping sample data - allowing real user registration");
    }

    private void seedData() {
        // Create demo user
        User demoUser = new User("demo-firebase-uid", "demo@finsight.ai", "John", "Doe");
        demoUser.setCurrency("ZAR");
        demoUser.setDarkMode(false);
        demoUser = userRepository.save(demoUser);

        // Create sample expenses
        List<Expense> expenses = Arrays.asList(
            new Expense("Grocery shopping", new BigDecimal("85.50"), ExpenseCategory.GROCERIES, LocalDate.now().minusDays(1), demoUser),
            new Expense("Gas station", new BigDecimal("45.20"), ExpenseCategory.TRANSPORTATION, LocalDate.now().minusDays(2), demoUser),
            new Expense("Coffee shop", new BigDecimal("12.75"), ExpenseCategory.FOOD_DINING, LocalDate.now().minusDays(3), demoUser),
            new Expense("Netflix subscription", new BigDecimal("15.99"), ExpenseCategory.ENTERTAINMENT, LocalDate.now().minusDays(4), demoUser),
            new Expense("Electricity bill", new BigDecimal("120.00"), ExpenseCategory.BILLS_UTILITIES, LocalDate.now().minusDays(5), demoUser),
            new Expense("Lunch at restaurant", new BigDecimal("28.50"), ExpenseCategory.FOOD_DINING, LocalDate.now().minusDays(6), demoUser),
            new Expense("Book purchase", new BigDecimal("19.99"), ExpenseCategory.EDUCATION, LocalDate.now().minusDays(7), demoUser),
            new Expense("Gym membership", new BigDecimal("50.00"), ExpenseCategory.HEALTHCARE, LocalDate.now().minusDays(8), demoUser),
            new Expense("Online shopping", new BigDecimal("75.30"), ExpenseCategory.SHOPPING, LocalDate.now().minusDays(9), demoUser),
            new Expense("Uber ride", new BigDecimal("18.45"), ExpenseCategory.TRANSPORTATION, LocalDate.now().minusDays(10), demoUser),
            new Expense("Movie tickets", new BigDecimal("24.00"), ExpenseCategory.ENTERTAINMENT, LocalDate.now().minusDays(11), demoUser),
            new Expense("Haircut", new BigDecimal("35.00"), ExpenseCategory.PERSONAL_CARE, LocalDate.now().minusDays(12), demoUser),
            new Expense("Phone bill", new BigDecimal("65.00"), ExpenseCategory.BILLS_UTILITIES, LocalDate.now().minusDays(13), demoUser),
            new Expense("Grocery shopping", new BigDecimal("92.15"), ExpenseCategory.GROCERIES, LocalDate.now().minusDays(14), demoUser),
            new Expense("Gift for friend", new BigDecimal("40.00"), ExpenseCategory.GIFTS_DONATIONS, LocalDate.now().minusDays(15), demoUser)
        );

        expenseRepository.saveAll(expenses);

        // Create sample budgets for current month
        int currentMonth = LocalDate.now().getMonthValue();
        int currentYear = LocalDate.now().getYear();

        List<Budget> budgets = Arrays.asList(
            new Budget(ExpenseCategory.GROCERIES, new BigDecimal("400.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.FOOD_DINING, new BigDecimal("300.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.TRANSPORTATION, new BigDecimal("200.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.ENTERTAINMENT, new BigDecimal("150.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.BILLS_UTILITIES, new BigDecimal("250.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.SHOPPING, new BigDecimal("200.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.HEALTHCARE, new BigDecimal("100.00"), currentMonth, currentYear, demoUser),
            new Budget(ExpenseCategory.PERSONAL_CARE, new BigDecimal("80.00"), currentMonth, currentYear, demoUser)
        );

        budgetRepository.saveAll(budgets);

        // Create sample recurring expenses
        List<RecurringExpense> recurringExpenses = Arrays.asList(
            new RecurringExpense("Netflix Subscription", new BigDecimal("15.99"), ExpenseCategory.ENTERTAINMENT, 
                               RecurrenceFrequency.MONTHLY, LocalDate.now().withDayOfMonth(1), demoUser),
            new RecurringExpense("Gym Membership", new BigDecimal("50.00"), ExpenseCategory.HEALTHCARE, 
                               RecurrenceFrequency.MONTHLY, LocalDate.now().withDayOfMonth(15), demoUser),
            new RecurringExpense("Phone Bill", new BigDecimal("65.00"), ExpenseCategory.BILLS_UTILITIES, 
                               RecurrenceFrequency.MONTHLY, LocalDate.now().withDayOfMonth(5), demoUser),
            new RecurringExpense("Coffee Subscription", new BigDecimal("24.99"), ExpenseCategory.FOOD_DINING, 
                               RecurrenceFrequency.MONTHLY, LocalDate.now().withDayOfMonth(10), demoUser)
        );

        recurringExpenseRepository.saveAll(recurringExpenses);

        System.out.println("Sample data seeded successfully!");
    }
}
