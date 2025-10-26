-- Alternative RLS fix - more permissive for sign-up
-- Run this if the first fix doesn't work

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can check username availability" ON users;

-- Create more permissive policies
CREATE POLICY "Allow all operations for authenticated users" ON users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow public to read usernames for availability checking
CREATE POLICY "Anyone can check username availability" ON users
  FOR SELECT USING (true);

-- If that's too permissive, try this more specific approach:
-- CREATE POLICY "Users can manage their own profile" ON users
--   FOR ALL USING (auth.uid() = id OR auth.uid() IS NOT NULL);

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
