// Social Features Types
import { Lobby } from './database'

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
  friend?: UserProfile
}

export interface UserProfile {
  id: string
  username: string
  display_name: string
  email: string
  avatar_url?: string
  status?: 'online' | 'away' | 'busy' | 'offline'
  last_seen?: string
  current_lobby_id?: string
}

export interface FriendGroup {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  members?: Friend[]
}

export interface PrivateLobby {
  id: string
  lobby_id: string
  is_private: boolean
  invite_code: string
  created_by: string
  created_at: string
  lobby?: Lobby
}

export interface LobbyInvite {
  id: string
  lobby_id: string
  invited_user_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at?: string
  created_at: string
  lobby?: Lobby
  invited_user?: UserProfile
  invited_by_user?: UserProfile
}

export interface ChatRoom {
  id: string
  lobby_id: string
  name?: string
  is_active: boolean
  created_at: string
  last_message?: ChatMessage
  unread_count?: number
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  message_type: 'text' | 'system' | 'achievement' | 'join' | 'leave'
  is_edited: boolean
  edited_at?: string
  created_at: string
  user?: UserProfile
}

export interface UserPresence {
  id: string
  user_id: string
  status: 'online' | 'away' | 'busy' | 'offline'
  last_seen: string
  current_lobby_id?: string
  updated_at: string
}

export interface SocialNotification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'lobby_invite' | 'message' | 'achievement'
  title: string
  message: string
  data?: Record<string, any>
  is_read: boolean
  created_at: string
}

export interface FriendRequest {
  id: string
  from_user: UserProfile
  to_user: UserProfile
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface ChatRoomWithMessages extends ChatRoom {
  messages: ChatMessage[]
  participants: UserProfile[]
}

export interface SocialStats {
  total_friends: number
  online_friends: number
  pending_requests: number
  unread_notifications: number
  total_lobbies_created: number
  total_lobbies_joined: number
}
