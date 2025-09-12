package com.finsight.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Database migration service to handle schema updates that Hibernate DDL can't handle automatically
 */
@Service
public class DatabaseMigrationService implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        try {
            migrateCategoryConstraints();
            migrateNotesFieldLength();
        } catch (Exception e) {
            logger.warn("Database migration failed, but application will continue: {}", e.getMessage());
        }
    }
    
    /**
     * Update category check constraints to include CRYPTO category
     */
    private void migrateCategoryConstraints() {
        logger.info("Checking and updating category constraints...");
        
        try {
            // Update budgets table constraint
            try {
                logger.info("Updating budgets category constraint...");
                jdbcTemplate.execute("ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_check");
                jdbcTemplate.execute("ALTER TABLE budgets ADD CONSTRAINT budgets_category_check " +
                    "CHECK (category IN ('FOOD_DINING', 'TRANSPORTATION', 'SHOPPING', 'ENTERTAINMENT', 'BILLS_UTILITIES', " +
                    "'HEALTHCARE', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'PERSONAL_CARE', 'BUSINESS', 'GIFTS_DONATIONS', " +
                    "'INVESTMENTS', 'CRYPTO', 'OTHER'))");
                logger.info("✅ Updated budgets category constraint successfully");
            } catch (RuntimeException e) {
                logger.warn("Failed to update budgets constraint: {}", e.getMessage());
            }
            
            // Update expenses table constraint
            try {
                logger.info("Updating expenses category constraint...");
                jdbcTemplate.execute("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check");
                jdbcTemplate.execute("ALTER TABLE expenses ADD CONSTRAINT expenses_category_check " +
                    "CHECK (category IN ('FOOD_DINING', 'TRANSPORTATION', 'SHOPPING', 'ENTERTAINMENT', 'BILLS_UTILITIES', " +
                    "'HEALTHCARE', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'PERSONAL_CARE', 'BUSINESS', 'GIFTS_DONATIONS', " +
                    "'INVESTMENTS', 'CRYPTO', 'OTHER'))");
                logger.info("✅ Updated expenses category constraint successfully");
            } catch (RuntimeException e) {
                logger.warn("Failed to update expenses constraint: {}", e.getMessage());
            }
            
            logger.info("✅ Category constraint migration completed");
            
        } catch (Exception e) {
            logger.error("Error during category constraint migration: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Increase notes field length to accommodate longer receipt scanning notes
     */
    private void migrateNotesFieldLength() {
        logger.info("Checking and updating notes field length...");
        
        try {
            // Update expenses table notes column length
            try {
                logger.info("Updating expenses notes column length...");
                jdbcTemplate.execute("ALTER TABLE expenses ALTER COLUMN notes TYPE VARCHAR(1000)");
                logger.info("✅ Updated expenses notes column length to 1000 characters");
            } catch (RuntimeException e) {
                logger.warn("Failed to update expenses notes column length (may already be correct): {}", e.getMessage());
            }
            
            logger.info("✅ Notes field length migration completed");
            
        } catch (Exception e) {
            logger.error("Error during notes field length migration: {}", e.getMessage(), e);
            throw e;
        }
    }
}