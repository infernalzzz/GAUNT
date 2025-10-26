-- Fix RLS policies for lobby updates
-- Run this in your Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can update lobbies" ON lobbies;
DROP POLICY IF EXISTS "Lobby creators can update their lobbies" ON lobbies;

-- Allow authenticated users to update lobbies (for player count and status updates)
CREATE POLICY "Authenticated users can update lobbies" ON lobbies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow lobby creators to update their own lobbies
CREATE POLICY "Lobby creators can update their lobbies" ON lobbies
  FOR UPDATE USING (auth.uid() = created_by);

-- Also allow updating lobbies when user is a participant (for real-time updates)
CREATE POLICY "Participants can update lobbies" ON lobbies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lobby_participants 
      WHERE lobby_participants.lobby_id = lobbies.id 
      AND lobby_participants.user_id = auth.uid()
    )
  );
