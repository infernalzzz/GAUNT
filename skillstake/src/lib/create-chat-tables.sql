-- Chat System Tables
-- Run this in your Supabase SQL Editor to create chat functionality

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lobby_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'achievement', 'join', 'leave')),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_lobby_id ON chat_rooms(lobby_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
-- Anyone can view chat rooms
CREATE POLICY "Anyone can view chat rooms" ON chat_rooms
  FOR SELECT USING (true);

-- Function to create chat room (called by service layer, not directly by users)
CREATE OR REPLACE FUNCTION create_chat_room_for_lobby(lobby_uuid UUID)
RETURNS UUID AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Check if chat room already exists
  SELECT id INTO room_id
  FROM chat_rooms
  WHERE lobby_id = lobby_uuid AND is_active = true
  LIMIT 1;
  
  -- If it exists, return existing room ID
  IF room_id IS NOT NULL THEN
    RETURN room_id;
  END IF;
  
  -- Create new chat room
  INSERT INTO chat_rooms (lobby_id, is_active)
  VALUES (lobby_uuid, true)
  RETURNING id INTO room_id;
  
  RETURN room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for chat_messages
-- Anyone can view messages in chat rooms
CREATE POLICY "Anyone can view chat messages" ON chat_messages
  FOR SELECT USING (true);

-- Logged in users can send messages (must match their own user_id)
CREATE POLICY "Logged in users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

-- No UPDATE or DELETE policies - messages cannot be edited or deleted

