-- Cleanup Payment Tables - Run this in your Supabase SQL Editor
-- This will remove all payment-related tables and functions

-- Drop payment-related tables (in reverse dependency order)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS user_balance CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Drop payment-related functions
DROP FUNCTION IF EXISTS update_user_balance(UUID, INTEGER, VARCHAR, TEXT, UUID, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS get_user_balance(UUID);
DROP FUNCTION IF EXISTS process_successful_payment(UUID, VARCHAR);

-- Note: This will permanently delete all payment data
-- Make sure you don't need any of this data before running
