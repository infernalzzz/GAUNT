-- Test script to check if users are being created properly
-- Run this in your Supabase SQL Editor after signing up

-- Check all users in the users table
SELECT id, username, email, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check auth users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- Check if there's a mismatch between auth.users and users table
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  u.id as user_id,
  u.username,
  u.email as user_email
FROM auth.users a
LEFT JOIN users u ON a.id = u.id
ORDER BY a.created_at DESC;
