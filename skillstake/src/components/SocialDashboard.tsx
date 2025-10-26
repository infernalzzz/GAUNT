import { useState, useEffect } from 'react'
import { Users, MessageCircle, Bell } from 'lucide-react'
import FriendsList from './FriendsList'
import { SocialService } from '../lib/services/socialService'
import type { SocialStats, SocialNotification } from '../types/social'

const SocialDashboard = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'chat' | 'notifications'>('friends')
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [notifications, setNotifications] = useState<SocialNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSocialData()
  }, [])

  const loadSocialData = async () => {
    try {
      setIsLoading(true)
      const [statsData, notificationsData] = await Promise.all([
        SocialService.getSocialStats(),
        SocialService.getNotifications()
      ])
      
      setStats(statsData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error loading social data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await SocialService.markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await SocialService.markAllNotificationsAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading social features...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Social</h1>
          <p className="text-gray-400">Connect with friends and join private lobbies</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total_friends}</p>
                  <p className="text-gray-400">Total Friends</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.online_friends}</p>
                  <p className="text-gray-400">Online Friends</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <Bell className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pending_requests}</p>
                  <p className="text-gray-400">Pending Requests</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.unread_notifications}</p>
                  <p className="text-gray-400">Unread Notifications</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Friends
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Notifications ({notifications.filter(n => !n.is_read).length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'friends' && (
          <FriendsList />
        )}

        {activeTab === 'chat' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Lobby Chat</h2>
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Chat</h3>
              <p className="text-gray-400">Join a lobby to start chatting with other players</p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Notifications</h3>
                  <p className="text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        notification.is_read
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-blue-900/20 border-blue-500/20'
                      }`}
                      onClick={() => !notification.is_read && handleMarkNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            notification.is_read ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            notification.is_read ? 'text-gray-400' : 'text-gray-300'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full ml-4 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialDashboard
