import { useState, useEffect } from 'react'
import { Users, MessageCircle, Bell, Settings } from 'lucide-react'
import { SocialService } from '../lib/services/socialService'
import type { SocialStats, SocialNotification } from '../types/social'

/**
 * Social Integration Component
 * Provides social features integration throughout the app
 */
const SocialIntegration = () => {
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [notifications, setNotifications] = useState<SocialNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSocialData()
    
    // Set up real-time subscriptions
    const unsubscribe = setupRealtimeSubscriptions()
    
    return () => {
      unsubscribe()
    }
  }, [])

  const loadSocialData = async () => {
    try {
      setIsLoading(true)
      const [statsData, notificationsData] = await Promise.all([
        SocialService.getSocialStats(),
        SocialService.getNotifications(5) // Get latest 5 notifications
      ])
      
      setStats(statsData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error loading social data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // This would set up real-time subscriptions for social features
    // Implementation depends on your specific needs
    return () => {
      // Cleanup subscriptions
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

  if (isLoading) {
    return null // Don't show anything while loading
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Social Stats Widget */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4 shadow-lg">
        <div className="flex items-center space-x-4">
          {/* Friends */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm">
              {stats?.total_friends || 0} friends
            </span>
          </div>

          {/* Online Friends */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-white text-sm">
              {stats?.online_friends || 0} online
            </span>
          </div>

          {/* Notifications */}
          {stats && stats.unread_notifications > 0 && (
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">
                {stats.unread_notifications} new
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => window.location.href = '/social'}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Social Dashboard"
        >
          <Users className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => window.location.href = '/social?tab=chat'}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        
        {stats && stats.unread_notifications > 0 && (
          <button
            onClick={() => window.location.href = '/social?tab=notifications'}
            className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full shadow-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
        )}
      </div>
    </div>
  )
}

export default SocialIntegration
