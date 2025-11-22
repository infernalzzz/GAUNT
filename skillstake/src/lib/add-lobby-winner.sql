-- Add winner_id field to lobbies table
-- Run this in your Supabase SQL Editor to enable winner tracking

-- Add winner_id column to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_lobbies_winner_id ON lobbies(winner_id);

-- Add comment to document the field
COMMENT ON COLUMN lobbies.winner_id IS 'User ID of the match winner, set when lobby is completed by admin';
