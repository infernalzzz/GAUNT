-- Migration script to update existing users table
-- Run this in your Supabase SQL Editor

-- First, let's see what the current table structure looks like
-- (This is just for reference, don't run this)
-- \d users;

-- Drop the existing primary key constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Add the foreign key constraint to auth.users
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure the id column is the primary key
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Enable Row Level Security if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can check username availability" ON users;

-- Create new policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public to read usernames for availability checking
CREATE POLICY "Anyone can check username availability" ON users
  FOR SELECT USING (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
