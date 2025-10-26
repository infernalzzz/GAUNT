-- Test email configuration in Supabase
-- Run this to check your current email settings

-- Check current auth configuration
SELECT 
  enable_signup,
  enable_confirmations,
  enable_recoveries,
  enable_email_change
FROM auth.config;

-- Check recent user signups and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Pending Confirmation'
  END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any unconfirmed users
SELECT COUNT(*) as unconfirmed_users
FROM auth.users 
WHERE email_confirmed_at IS NULL;
