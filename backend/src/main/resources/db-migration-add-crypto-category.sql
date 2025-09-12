-- Migration script to add CRYPTO category support to database constraints
-- Run this against your PostgreSQL database to fix the category constraint issues

-- First, let's see the current constraints (for reference)
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name LIKE '%category%';

-- Drop and recreate the check constraint for budgets table
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_category_check 
CHECK (category IN ('FOOD_DINING', 'TRANSPORTATION', 'SHOPPING', 'ENTERTAINMENT', 'BILLS_UTILITIES', 'HEALTHCARE', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'PERSONAL_CARE', 'BUSINESS', 'GIFTS_DONATIONS', 'INVESTMENTS', 'CRYPTO', 'OTHER'));

-- Drop and recreate the check constraint for expenses table  
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
CHECK (category IN ('FOOD_DINING', 'TRANSPORTATION', 'SHOPPING', 'ENTERTAINMENT', 'BILLS_UTILITIES', 'HEALTHCARE', 'EDUCATION', 'TRAVEL', 'GROCERIES', 'PERSONAL_CARE', 'BUSINESS', 'GIFTS_DONATIONS', 'INVESTMENTS', 'CRYPTO', 'OTHER'));

-- Verify the constraints were updated
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%category%';