package com.finsight.ai.repository;

import com.finsight.ai.entity.RecurringExpense;
import com.finsight.ai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {
    List<RecurringExpense> findByUserOrderByNextDueDateAsc(User user);
    List<RecurringExpense> findByUserAndIsActiveOrderByNextDueDateAsc(User user, Boolean isActive);

    @Query("SELECT r FROM RecurringExpense r WHERE r.isActive = true AND r.nextDueDate <= :date")
    List<RecurringExpense> findDueRecurringExpenses(@Param("date") LocalDate date);

    @Query("SELECT r FROM RecurringExpense r WHERE r.user = :user AND r.isActive = true AND r.nextDueDate BETWEEN :startDate AND :endDate")
    List<RecurringExpense> findUpcomingRecurringExpenses(@Param("user") User user, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
