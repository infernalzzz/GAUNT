-- Disable email confirmation in Supabase
-- Run this in your Supabase SQL Editor

-- Method 1: Update auth config
UPDATE auth.config 
SET 
  enable_confirmations = false,
  enable_signup = true
WHERE id = 'auth';

-- Method 2: Check current auth settings
SELECT * FROM auth.config;

-- Method 3: Alternative approach - update user confirmation status
-- This might help if the above doesn't work
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check if there are any unconfirmed users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
