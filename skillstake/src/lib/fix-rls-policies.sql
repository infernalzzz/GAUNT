-- Fix RLS policies to allow user profile creation during sign-up
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can check username availability" ON users;

-- Create new policies that work with auth.uid()
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (this is the key fix)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public to read usernames for availability checking
CREATE POLICY "Anyone can check username availability" ON users
  FOR SELECT USING (true);

-- Alternative: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Check if policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
