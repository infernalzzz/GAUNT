-- Test script to verify sign-up flow works
-- Run this after testing a new sign-up

-- Check if new user was created in auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if user profile was created in users table
SELECT 
  u.id,
  u.username,
  u.email,
  u.created_at,
  a.email_confirmed_at
FROM users u
LEFT JOIN auth.users a ON u.id = a.id
ORDER BY u.created_at DESC 
LIMIT 5;

-- Check for any mismatches
SELECT 
  'Auth users without profiles' as issue,
  a.id,
  a.email
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'User profiles without auth' as issue,
  u.id,
  u.email
FROM users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE a.id IS NULL;
