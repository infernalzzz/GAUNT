import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AchievementNotification } from '../types/achievements'

export const useAchievementNotifications = () => {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([])
  const [isEnabled, setIsEnabled] = useState(true)

  // Listen for new achievements
  useEffect(() => {
    if (!isEnabled) return

    const channel = supabase
      .channel('achievement-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_achievements' 
        }, 
        async (payload) => {
          console.log('🎉 New achievement unlocked:', payload)
          
          // Get the achievement details
          const { data: achievementData, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('id', payload.new.achievement_id)
            .single()

          if (error) {
            console.error('Error fetching achievement:', error)
            return
          }

          // Create notification
          const notification: AchievementNotification = {
            id: payload.new.id,
            achievement: achievementData,
            unlocked_at: payload.new.unlocked_at,
            is_read: false
          }

          // Add to notifications
          setNotifications(prev => [notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isEnabled])

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  return {
    notifications,
    isEnabled,
    removeNotification,
    clearAllNotifications,
    toggleNotifications
  }
}
