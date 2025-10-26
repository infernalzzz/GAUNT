-- Admin System Schema
-- Run this in your Supabase SQL Editor to add admin functionality

-- Add admin role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin_actions table to track admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'delete_lobby', 'approve_game', 'ban_user', etc.
  target_id UUID, -- ID of the target (lobby_id, user_id, etc.)
  target_type VARCHAR(50), -- 'lobby', 'user', 'game', etc.
  reason TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games_review table for game approval workflow
CREATE TABLE IF NOT EXISTS games_review (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  submitted_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_review ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_actions
CREATE POLICY "Admins can view all admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- RLS Policies for games_review
CREATE POLICY "Anyone can view games review" ON games_review
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit games for review" ON games_review
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update games review" ON games_review
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND users.is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type VARCHAR(50),
  target_id UUID,
  target_type VARCHAR(50),
  reason TEXT DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  -- Insert admin action
  INSERT INTO admin_actions (admin_id, action_type, target_id, target_type, reason, details)
  VALUES (auth.uid(), action_type, target_id, target_type, reason, details)
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user (replace with your admin email)
-- UPDATE users SET is_admin = TRUE, role = 'admin' WHERE email = 'your-admin-email@example.com';
