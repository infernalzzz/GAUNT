import { Trophy, Lock, CheckCircle } from 'lucide-react'
import type { AchievementProgress } from '../types/achievements'

interface AchievementCardProps {
  achievementProgress: AchievementProgress
  showProgress?: boolean
}

const AchievementCard = ({ achievementProgress, showProgress = true }: AchievementCardProps) => {
  const { achievement, progress, max_progress, percentage, is_unlocked, unlocked_at } = achievementProgress

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-500/10'
      case 'rare': return 'border-blue-500 bg-blue-500/10'
      case 'epic': return 'border-purple-500 bg-purple-500/10'
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className={`relative rounded-lg border-2 p-4 transition-all duration-300 ${
      is_unlocked 
        ? `${getRarityColor(achievement.rarity)} hover:scale-105` 
        : 'border-gray-700 bg-gray-800/50 opacity-60'
    }`}>
      {/* Achievement Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`text-3xl ${is_unlocked ? '' : 'grayscale'}`}>
            {achievement.icon}
          </div>
          <div>
            <h3 className={`font-semibold ${is_unlocked ? 'text-white' : 'text-gray-400'}`}>
              {achievement.name}
            </h3>
            <p className={`text-sm ${getRarityTextColor(achievement.rarity)}`}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {is_unlocked ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Lock className="w-5 h-5 text-gray-500" />
          )}
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                {achievement.points}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm mb-3 ${is_unlocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {achievement.description}
      </p>

      {/* Progress Bar */}
      {showProgress && !is_unlocked && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}/{max_progress}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {percentage}% complete
          </div>
        </div>
      )}

      {/* Unlocked Date */}
      {is_unlocked && unlocked_at && (
        <div className="text-xs text-green-400">
          Unlocked {new Date(unlocked_at).toLocaleDateString()}
        </div>
      )}

      {/* Hidden Achievement Indicator */}
      {achievement.is_hidden && !is_unlocked && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full" title="Hidden Achievement" />
        </div>
      )}
    </div>
  )
}

export default AchievementCard
