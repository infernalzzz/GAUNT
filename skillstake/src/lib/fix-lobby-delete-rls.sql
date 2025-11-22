-- Fix RLS policies for lobby deletion
-- Run this in your Supabase SQL Editor to allow admins to delete lobbies

-- Drop existing delete policies if any
DROP POLICY IF EXISTS "Admins can delete lobbies" ON lobbies;
DROP POLICY IF EXISTS "Lobby creators can delete their lobbies" ON lobbies;
DROP POLICY IF EXISTS "Users can delete their own lobbies" ON lobbies;

-- Allow only admins to delete lobbies
CREATE POLICY "Admins can delete lobbies" ON lobbies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'lobbies' AND cmd = 'DELETE';
