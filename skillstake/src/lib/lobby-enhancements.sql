-- Lobby Enhancements Schema
-- Run this in your Supabase SQL Editor to add custom titles and improve lobby functionality

-- Add custom title field to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS custom_title VARCHAR(200);
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing lobbies with default titles
UPDATE lobbies 
SET custom_title = CONCAT(game, ' - $', price, ' - ', region)
WHERE custom_title IS NULL;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_lobbies_search ON lobbies USING gin(to_tsvector('english', custom_title || ' ' || game || ' ' || region));

-- Update RLS policies to allow searching
CREATE POLICY "Anyone can search lobbies" ON lobbies
  FOR SELECT USING (true);

-- Add function to search lobbies by title only
CREATE OR REPLACE FUNCTION search_lobbies(search_term TEXT)
RETURNS TABLE (
  id UUID,
  game VARCHAR(100),
  custom_title VARCHAR(200),
  price DECIMAL(10,2),
  region VARCHAR(50),
  pot DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  bond_per_player DECIMAL(10,2),
  winner_amount DECIMAL(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  max_players INTEGER,
  current_players INTEGER,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.game,
    l.custom_title,
    l.price,
    l.region,
    l.pot,
    l.platform_fee,
    l.bond_per_player,
    l.winner_amount,
    l.status,
    l.created_at,
    l.updated_at,
    l.created_by,
    l.max_players,
    l.current_players,
    l.description
  FROM lobbies l
  WHERE 
    l.custom_title ILIKE '%' || search_term || '%'
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql;
