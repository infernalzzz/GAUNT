-- Fix RLS policies to allow participants to complete games
-- Run this in your Supabase SQL Editor

-- Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can update lobbies" ON lobbies;
DROP POLICY IF EXISTS "Lobby creators can update their lobbies" ON lobbies;
DROP POLICY IF EXISTS "Participants can update lobbies" ON lobbies;

-- Allow participants to update lobby status when completing games
CREATE POLICY "Participants can update lobby status" ON lobbies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lobby_participants 
      WHERE lobby_participants.lobby_id = lobbies.id 
      AND lobby_participants.user_id = auth.uid()
      AND lobby_participants.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lobby_participants 
      WHERE lobby_participants.lobby_id = lobbies.id 
      AND lobby_participants.user_id = auth.uid()
      AND lobby_participants.status = 'active'
    )
  );

-- Allow lobby creators to update their lobbies
CREATE POLICY "Lobby creators can update their lobbies" ON lobbies
  FOR UPDATE USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

