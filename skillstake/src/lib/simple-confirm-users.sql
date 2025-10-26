-- Simple script to confirm users
-- Run each line separately if needed

-- Step 1: Check unconfirmed users
SELECT id, email, email_confirmed_at FROM auth.users WHERE email_confirmed_at IS NULL;

-- Step 2: Confirm them (run this after step 1)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Step 3: Verify it worked
SELECT id, email, email_confirmed_at FROM auth.users ORDER BY created_at DESC;
