-- Fix RLS policies for lobby_participants to allow viewing all participants in a lobby
-- Run this in your Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own lobby participants" ON lobby_participants;

-- Create a new policy that allows viewing all participants in any lobby
CREATE POLICY "Anyone can view lobby participants" ON lobby_participants
  FOR SELECT USING (true);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON lobby_participants;
DROP POLICY IF EXISTS "Users can leave lobbies" ON lobby_participants;

-- Recreate the policies
CREATE POLICY "Users can join lobbies" ON lobby_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own participation status
CREATE POLICY "Users can update their own participation" ON lobby_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to leave lobbies (delete their own participation)
CREATE POLICY "Users can leave lobbies" ON lobby_participants
  FOR DELETE USING (auth.uid() = user_id);
