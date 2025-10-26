-- Simple fix for existing users table
-- This adds the necessary constraints without dropping the table

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can check username availability" ON users;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public to read usernames for availability checking
CREATE POLICY "Anyone can check username availability" ON users
  FOR SELECT USING (true);

-- Try to add foreign key constraint (this might fail if data doesn't match)
-- If it fails, we'll work around it
DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT users_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;
