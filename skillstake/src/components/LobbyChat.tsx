import { useState, useEffect, useRef } from 'react'
import { Send, Users, MessageCircle, Smile } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SocialService } from '../lib/services/socialService'
import type { ChatMessage, UserProfile } from '../types/social'

interface LobbyChatProps {
  lobbyId: string
  isOpen?: boolean
  onToggle?: () => void
}

const LobbyChat = ({ lobbyId, isOpen = true, onToggle }: LobbyChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [participants] = useState<UserProfile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lobbyId) {
      loadChatData()
      setupRealtimeSubscription()
    }
  }, [lobbyId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    try {
      setIsLoading(true)
      
      // Get or create chat room
      let chatRoom = await SocialService.getChatRoom(lobbyId)
      if (!chatRoom) {
        chatRoom = await SocialService.createChatRoom(lobbyId)
      }

      // Load messages
      const messagesData = await SocialService.getChatMessages(chatRoom.id)
      setMessages(messagesData)

      // Load participants (you'll need to implement this based on your lobby system)
      // TODO: Implement getLobbyParticipants function
      // setParticipants(await getLobbyParticipants(lobbyId))
    } catch (error) {
      console.error('Error loading chat data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`lobby-chat-${lobbyId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${lobbyId}`
        }, 
        async (payload) => {
          console.log('New chat message:', payload)
          
          // Get the full message with user data
          const { data: messageData } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:users(id, username, display_name)
            `)
            .eq('id', payload.new.id)
            .single()

          if (messageData) {
            setMessages(prev => [...prev, messageData])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const chatRoom = await SocialService.getChatRoom(lobbyId)
      if (!chatRoom) return

      await SocialService.sendMessage(chatRoom.id, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-yellow-400'
      case 'achievement': return 'text-green-400'
      case 'join': return 'text-blue-400'
      case 'leave': return 'text-red-400'
      default: return 'text-white'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="flex flex-col h-96 bg-gray-800 rounded-lg border border-gray-700">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Lobby Chat</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length}</span>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoading ? (
          <div className="text-center text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {message.user?.display_name?.charAt(0) || message.user?.username?.charAt(0) || '?'}
                </span>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {message.user?.display_name || message.user?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(message.created_at)}
                  </span>
                  {message.is_edited && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
                <p className={`text-sm ${getMessageTypeColor(message.message_type)}`}>
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-1">
          {newMessage.length}/500 characters
        </div>
      </div>
    </div>
  )
}

export default LobbyChat
