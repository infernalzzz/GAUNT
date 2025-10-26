-- Disable email verification in Supabase
-- Run this in your Supabase SQL Editor

-- Update the auth configuration to disable email confirmation
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false,
  enable_recoveries = true,
  enable_email_change = true,
  enable_phone_change = false,
  enable_phone_confirmations = false
WHERE id = 'auth';

-- Alternative approach: Update the auth settings directly
-- This might need to be done through the Supabase Dashboard instead
-- Go to Authentication > Settings > Email Auth and disable "Enable email confirmations"
