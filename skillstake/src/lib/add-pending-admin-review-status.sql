-- Add pending_admin_review status and game_id field
-- Run this in your Supabase SQL Editor

-- Update the status check constraint to include 'pending_admin_review'
ALTER TABLE lobbies DROP CONSTRAINT IF EXISTS lobbies_status_check;
ALTER TABLE lobbies ADD CONSTRAINT lobbies_status_check 
  CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled', 'pending_admin_review'));

-- Add game_id field to store the match/game ID when completing a game
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS game_id VARCHAR(255);

