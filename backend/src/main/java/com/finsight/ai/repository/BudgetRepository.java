package com.finsight.ai.repository;

import com.finsight.ai.entity.Budget;
import com.finsight.ai.entity.ExpenseCategory;
import com.finsight.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserOrderByCategory(User user);
    List<Budget> findByUserAndMonthAndYear(User user, Integer month, Integer year);
    Optional<Budget> findByUserAndCategoryAndMonthAndYear(User user, ExpenseCategory category, Integer month, Integer year);
    List<Budget> findByUserAndMonthAndYearOrderByCategory(User user, Integer month, Integer year);
}
