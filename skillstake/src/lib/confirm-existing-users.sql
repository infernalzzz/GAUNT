-- Confirm existing users who haven't confirmed their email
-- Run this in your Supabase SQL Editor

-- First, check which users need confirmation
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Confirm all unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verify the update worked
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
ORDER BY created_at DESC;
