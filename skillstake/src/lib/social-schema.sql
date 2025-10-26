-- Social Features Database Schema
-- Run this in your Supabase SQL Editor to add social functionality

-- Create friends table for friend relationships
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create friend_groups table for organizing friends
CREATE TABLE IF NOT EXISTS friend_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friend_group_members table for group memberships
CREATE TABLE IF NOT EXISTS friend_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, friend_id)
);

-- Create private_lobbies table (extends existing lobbies)
CREATE TABLE IF NOT EXISTS private_lobbies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT TRUE,
  invite_code VARCHAR(20) UNIQUE, -- for sharing private lobbies
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lobby_invites table for private lobby invitations
CREATE TABLE IF NOT EXISTS lobby_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_rooms table for lobby chat
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'achievement', 'join', 'leave')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_presence table for online status
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_lobby_id UUID REFERENCES lobbies(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for social notifications
CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'friend_request', 'friend_accepted', 'lobby_invite', 'message'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- additional data like lobby_id, friend_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends table
CREATE POLICY "Users can view their own friendships" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships" ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" ON friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for friend_groups
CREATE POLICY "Users can manage their own friend groups" ON friend_groups
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for friend_group_members
CREATE POLICY "Users can view group members of their groups" ON friend_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_groups 
      WHERE friend_groups.id = friend_group_members.group_id 
      AND friend_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage members of their groups" ON friend_group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM friend_groups 
      WHERE friend_groups.id = friend_group_members.group_id 
      AND friend_groups.user_id = auth.uid()
    )
  );

-- RLS Policies for private_lobbies
CREATE POLICY "Users can view private lobbies they created or are invited to" ON private_lobbies
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM lobby_invites 
      WHERE lobby_invites.lobby_id = private_lobbies.lobby_id 
      AND lobby_invites.invited_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create private lobbies" ON private_lobbies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for lobby_invites
CREATE POLICY "Users can view invites sent to them or by them" ON lobby_invites
  FOR SELECT USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "Users can create lobby invites" ON lobby_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update invites sent to them" ON lobby_invites
  FOR UPDATE USING (auth.uid() = invited_user_id);

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view chat rooms for lobbies they're in" ON chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lobby_participants 
      WHERE lobby_participants.lobby_id = chat_rooms.lobby_id 
      AND lobby_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms for their lobbies" ON chat_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lobbies 
      WHERE lobbies.id = chat_rooms.lobby_id 
      AND lobbies.created_by = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in rooms they have access to" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      JOIN lobby_participants ON lobby_participants.lobby_id = chat_rooms.lobby_id
      WHERE chat_rooms.id = chat_messages.room_id 
      AND lobby_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in rooms they have access to" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms 
      JOIN lobby_participants ON lobby_participants.lobby_id = chat_rooms.lobby_id
      WHERE chat_rooms.id = chat_messages.room_id 
      AND lobby_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_presence
CREATE POLICY "Users can view presence of their friends" ON user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = user_presence.user_id AND friends.status = 'accepted')
      OR (friends.friend_id = auth.uid() AND friends.user_id = user_presence.user_id AND friends.status = 'accepted')
    )
  );

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for social_notifications
CREATE POLICY "Users can view their own notifications" ON social_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON social_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for social features

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  friend_request_id UUID;
BEGIN
  -- Check if friendship already exists
  IF EXISTS (
    SELECT 1 FROM friends 
    WHERE (user_id = auth.uid() AND friend_id = target_user_id)
    OR (user_id = target_user_id AND friend_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Friendship already exists or request already sent';
  END IF;
  
  -- Create friend request
  INSERT INTO friends (user_id, friend_id, status)
  VALUES (auth.uid(), target_user_id, 'pending')
  RETURNING id INTO friend_request_id;
  
  -- Create notification
  INSERT INTO social_notifications (user_id, type, title, message, data)
  VALUES (
    target_user_id,
    'friend_request',
    'New Friend Request',
    'You have a new friend request',
    jsonb_build_object('from_user_id', auth.uid())
  );
  
  RETURN friend_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(friend_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the friendship status
  UPDATE friends 
  SET status = 'accepted', updated_at = NOW()
  WHERE user_id = friend_id AND friend_id = auth.uid() AND status = 'pending';
  
  -- Create notification for the requester
  INSERT INTO social_notifications (user_id, type, title, message, data)
  VALUES (
    friend_id,
    'friend_accepted',
    'Friend Request Accepted',
    'Your friend request has been accepted',
    jsonb_build_object('accepted_by', auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create private lobby
CREATE OR REPLACE FUNCTION create_private_lobby(
  lobby_data JSONB,
  invite_code VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_lobby_id UUID;
  new_private_lobby_id UUID;
  generated_code VARCHAR(20);
BEGIN
  -- Generate invite code if not provided
  IF invite_code IS NULL THEN
    generated_code := substring(md5(random()::text) from 1 for 8);
  ELSE
    generated_code := invite_code;
  END IF;
  
  -- Create the lobby first (using existing lobby creation logic)
  -- This would need to be adapted based on your existing lobby creation
  -- For now, we'll assume the lobby is created and we get the ID
  
  -- Create private lobby record
  INSERT INTO private_lobbies (lobby_id, is_private, invite_code, created_by)
  VALUES (new_lobby_id, TRUE, generated_code, auth.uid())
  RETURNING id INTO new_private_lobby_id;
  
  RETURN new_private_lobby_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user to private lobby
CREATE OR REPLACE FUNCTION invite_to_private_lobby(
  lobby_id UUID,
  invited_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  invite_id UUID;
BEGIN
  -- Create lobby invite
  INSERT INTO lobby_invites (lobby_id, invited_user_id, invited_by, expires_at)
  VALUES (lobby_id, invited_user_id, auth.uid(), NOW() + INTERVAL '24 hours')
  RETURNING id INTO invite_id;
  
  -- Create notification
  INSERT INTO social_notifications (user_id, type, title, message, data)
  VALUES (
    invited_user_id,
    'lobby_invite',
    'Private Lobby Invitation',
    'You have been invited to a private lobby',
    jsonb_build_object('lobby_id', lobby_id, 'invited_by', auth.uid())
  );
  
  RETURN invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  new_status VARCHAR(20),
  current_lobby_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, current_lobby_id, updated_at)
  VALUES (auth.uid(), new_status, NOW(), current_lobby_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    status = new_status,
    last_seen = NOW(),
    current_lobby_id = current_lobby_id,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends()
RETURNS TABLE(
  friend_id UUID,
  username VARCHAR,
  display_name VARCHAR,
  status VARCHAR,
  last_seen TIMESTAMP WITH TIME ZONE,
  current_lobby_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    u.username,
    u.display_name,
    p.status,
    p.last_seen,
    p.current_lobby_id
  FROM friends f
  JOIN users u ON u.id = f.friend_id
  LEFT JOIN user_presence p ON p.user_id = f.friend_id
  WHERE f.user_id = auth.uid() AND f.status = 'accepted'
  UNION
  SELECT 
    f.user_id as friend_id,
    u.username,
    u.display_name,
    p.status,
    p.last_seen,
    p.current_lobby_id
  FROM friends f
  JOIN users u ON u.id = f.user_id
  LEFT JOIN user_presence p ON p.user_id = f.user_id
  WHERE f.friend_id = auth.uid() AND f.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_id ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_is_read ON social_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_lobby_invites_invited_user_id ON lobby_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_invites_status ON lobby_invites(status);
