import { supabase } from '../supabase'
import type { 
  Friend, 
  UserProfile, 
  FriendGroup, 
  PrivateLobby, 
  LobbyInvite, 
  ChatRoom, 
  ChatMessage, 
  SocialNotification,
  SocialStats 
} from '../../types/social'

export class SocialService {
  // Friend System
  
  // Send friend request
  static async sendFriendRequest(targetUserId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        target_user_id: targetUserId
      })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error sending friend request:', err)
      throw err
    }
  }

  // Accept friend request
  static async acceptFriendRequest(friendId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('accept_friend_request', {
        friend_id: friendId
      })
      
      if (error) throw error
    } catch (err) {
      console.error('Error accepting friend request:', err)
      throw err
    }
  }

  // Get user's friends
  static async getFriends(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_friends')
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting friends:', err)
      return []
    }
  }

  // Get friend requests (sent and received)
  static async getFriendRequests(): Promise<{
    sent: Friend[]
    received: Friend[]
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('friends')
          .select(`
            *,
            friend:users!friends_friend_id_fkey(id, username, display_name, email)
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        
        supabase
          .from('friends')
          .select(`
            *,
            user:users!friends_user_id_fkey(id, username, display_name, email)
          `)
          .eq('friend_id', user.id)
          .eq('status', 'pending')
      ])

      if (sentResult.error) throw sentResult.error
      if (receivedResult.error) throw receivedResult.error

      return {
        sent: sentResult.data || [],
        received: receivedResult.data || []
      }
    } catch (err) {
      console.error('Error getting friend requests:', err)
      return { sent: [], received: [] }
    }
  }

  // Remove friend
  static async removeFriend(friendId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${friendId},friend_id.eq.${friendId})`)
      
      if (error) throw error
    } catch (err) {
      console.error('Error removing friend:', err)
      throw err
    }
  }

  // Friend Groups
  
  // Create friend group
  static async createFriendGroup(name: string, color: string = '#3B82F6'): Promise<FriendGroup> {
    try {
      const { data, error } = await supabase
        .from('friend_groups')
        .insert({ name, color })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating friend group:', err)
      throw err
    }
  }

  // Get user's friend groups
  static async getFriendGroups(): Promise<FriendGroup[]> {
    try {
      const { data, error } = await supabase
        .from('friend_groups')
        .select(`
          *,
          members:friend_group_members(
            friend:users(id, username, display_name)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting friend groups:', err)
      return []
    }
  }

  // Add friend to group
  static async addFriendToGroup(groupId: string, friendId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('friend_group_members')
        .insert({ group_id: groupId, friend_id: friendId })
      
      if (error) throw error
    } catch (err) {
      console.error('Error adding friend to group:', err)
      throw err
    }
  }

  // Private Lobbies
  
  // Create private lobby
  static async createPrivateLobby(lobbyData: any, inviteCode?: string): Promise<PrivateLobby> {
    try {
      const { data, error } = await supabase.rpc('create_private_lobby', {
        lobby_data: lobbyData,
        invite_code: inviteCode
      })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating private lobby:', err)
      throw err
    }
  }

  // Invite user to private lobby
  static async inviteToPrivateLobby(lobbyId: string, userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('invite_to_private_lobby', {
        lobby_id: lobbyId,
        invited_user_id: userId
      })
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error inviting to private lobby:', err)
      throw err
    }
  }

  // Get private lobby invites
  static async getLobbyInvites(): Promise<LobbyInvite[]> {
    try {
      const { data, error } = await supabase
        .from('lobby_invites')
        .select(`
          *,
          lobby:lobbies(*),
          invited_user:users!lobby_invites_invited_user_id_fkey(id, username, display_name),
          invited_by_user:users!lobby_invites_invited_by_fkey(id, username, display_name)
        `)
        .eq('invited_user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting lobby invites:', err)
      return []
    }
  }

  // Accept lobby invite
  static async acceptLobbyInvite(inviteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lobby_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
      
      if (error) throw error
    } catch (err) {
      console.error('Error accepting lobby invite:', err)
      throw err
    }
  }

  // Chat System
  
  // Get chat room for lobby
  static async getChatRoom(lobbyId: string): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('lobby_id', lobbyId)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      console.error('Error getting chat room:', err)
      return null
    }
  }

  // Create chat room for lobby
  static async createChatRoom(lobbyId: string, name?: string): Promise<ChatRoom> {
    try {
      // Use database function to create chat room (handles duplicates)
      const { data, error } = await supabase.rpc('create_chat_room_for_lobby', {
        lobby_uuid: lobbyId
      })
      
      if (error) throw error
      
      // Fetch the created/existing room
      const { data: roomData, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', data)
        .single()
      
      if (fetchError) throw fetchError
      return roomData
    } catch (err) {
      console.error('Error creating chat room:', err)
      throw err
    }
  }

  // Get chat messages
  static async getChatMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(id, username, display_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return (data || []).reverse()
    } catch (err) {
      console.error('Error getting chat messages:', err)
      return []
    }
  }

  // Send chat message
  static async sendMessage(roomId: string, message: string, messageType: string = 'text'): Promise<ChatMessage> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to send messages')
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ 
          room_id: roomId, 
          message, 
          message_type: messageType,
          user_id: user.id
        })
        .select(`
          *,
          user:users(id, username, display_name)
        `)
        .single()
      
      if (error) {
        console.error('Supabase error sending message:', error)
        throw error
      }
      return data
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  // User Presence
  
  // Update user presence
  static async updatePresence(status: 'online' | 'away' | 'busy' | 'offline', currentLobbyId?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_user_presence', {
        new_status: status,
        current_lobby_id: currentLobbyId
      })
      
      if (error) throw error
    } catch (err) {
      console.error('Error updating presence:', err)
      throw err
    }
  }

  // Get online friends
  static async getOnlineFriends(): Promise<UserProfile[]> {
    try {
      const friends = await this.getFriends()
      return friends.filter(friend => friend.status === 'online')
    } catch (err) {
      console.error('Error getting online friends:', err)
      return []
    }
  }

  // Notifications
  
  // Get social notifications
  static async getNotifications(limit: number = 20): Promise<SocialNotification[]> {
    try {
      const { data, error } = await supabase
        .from('social_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting notifications:', err)
      return []
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      
      if (error) throw error
    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(): Promise<void> {
    try {
      const { error } = await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('is_read', false)
      
      if (error) throw error
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }

  // Get unread notification count
  static async getUnreadNotificationCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('social_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      
      if (error) throw error
      return count || 0
    } catch (err) {
      console.error('Error getting unread notification count:', err)
      return 0
    }
  }

  // Search users
  static async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, email')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error searching users:', err)
      return []
    }
  }

  // Get social stats
  static async getSocialStats(): Promise<SocialStats> {
    try {
      const [friendsResult, notificationsResult] = await Promise.all([
        this.getFriends(),
        this.getUnreadNotificationCount()
      ])

      const onlineFriends = friendsResult.filter(friend => friend.status === 'online')
      const pendingRequests = (await this.getFriendRequests()).received.length

      return {
        total_friends: friendsResult.length,
        online_friends: onlineFriends.length,
        pending_requests: pendingRequests,
        unread_notifications: notificationsResult,
        total_lobbies_created: 0, // Implement based on your lobby system
        total_lobbies_joined: 0   // Implement based on your lobby system
      }
    } catch (err) {
      console.error('Error getting social stats:', err)
      return {
        total_friends: 0,
        online_friends: 0,
        pending_requests: 0,
        unread_notifications: 0,
        total_lobbies_created: 0,
        total_lobbies_joined: 0
      }
    }
  }
}
