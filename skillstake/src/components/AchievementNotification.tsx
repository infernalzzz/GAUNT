import { useState, useEffect } from 'react'
import { X, Trophy, Star } from 'lucide-react'
import type { AchievementNotification } from '../types/achievements'

interface AchievementNotificationProps {
  notification: AchievementNotification
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

const AchievementNotificationComponent = ({ 
  notification, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(closeTimer)
    }
    
    return () => clearTimeout(timer)
  }, [autoClose, duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-500/10'
      case 'rare': return 'border-blue-500 bg-blue-500/10'
      case 'epic': return 'border-purple-500 bg-purple-500/10'
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-500/20'
      case 'rare': return 'shadow-blue-500/30'
      case 'epic': return 'shadow-purple-500/30'
      case 'legendary': return 'shadow-yellow-500/40'
      default: return 'shadow-gray-500/20'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
      isVisible && !isLeaving 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
    }`}>
      <div className={`relative rounded-lg border-2 p-4 shadow-2xl ${getRarityColor(notification.achievement.rarity)} ${getRarityGlow(notification.achievement.rarity)}`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Achievement Content */}
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="text-4xl animate-bounce">
            {notification.achievement.icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Achievement Unlocked!</span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">
              {notification.achievement.name}
            </h3>
            
            <p className="text-sm text-gray-300 mb-2">
              {notification.achievement.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  +{notification.achievement.points} points
                </span>
              </div>
              
              <span className="text-xs text-gray-400">
                {new Date(notification.unlocked_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default AchievementNotificationComponent
