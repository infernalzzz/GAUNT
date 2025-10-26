-- User Verification Schema Updates
-- Run this in your Supabase SQL Editor to add verification functionality

-- Add verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_linked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dispute_rate DECIMAL(3,2) DEFAULT 0.00;

-- Update RLS policies to allow viewing verification status
CREATE POLICY "Users can view verification status" ON users
    FOR SELECT USING (true);

-- Create function to calculate dispute rate
CREATE OR REPLACE FUNCTION calculate_dispute_rate(user_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_matches INTEGER;
    disputed_matches INTEGER;
    rate DECIMAL(3,2);
BEGIN
    -- Count total matches for user
    SELECT COUNT(*) INTO total_matches
    FROM lobbies 
    WHERE created_by = user_id 
    AND status IN ('completed', 'cancelled');
    
    -- Count disputed matches (this would need to be tracked in a disputes table)
    -- For now, we'll use a placeholder calculation
    disputed_matches := 0;
    
    -- Calculate rate
    IF total_matches > 0 THEN
        rate := disputed_matches::DECIMAL / total_matches;
    ELSE
        rate := 0.00;
    END IF;
    
    RETURN rate;
END;
$$ LANGUAGE plpgsql;

-- Create function to update dispute rate
CREATE OR REPLACE FUNCTION update_dispute_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- Update dispute rate for the user
    UPDATE users 
    SET dispute_rate = calculate_dispute_rate(NEW.created_by)
    WHERE id = NEW.created_by;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update dispute rate when lobby status changes
DROP TRIGGER IF EXISTS update_user_dispute_rate ON lobbies;
CREATE TRIGGER update_user_dispute_rate
    AFTER UPDATE OF status ON lobbies
    FOR EACH ROW
    WHEN (NEW.status IN ('completed', 'cancelled'))
    EXECUTE FUNCTION update_dispute_rate();
