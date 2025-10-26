-- Check the current users table structure
-- Run this first to see what we're working with

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show constraints
SELECT conname, contype, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Show RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
