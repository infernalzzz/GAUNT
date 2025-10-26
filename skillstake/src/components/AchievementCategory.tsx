import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import AchievementCard from './AchievementCard'
import type { AchievementCategory as AchievementCategoryType } from '../types/achievements'

interface AchievementCategoryProps {
  category: AchievementCategoryType
  showProgress?: boolean
}

const AchievementCategory = ({ category, showProgress = true }: AchievementCategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{category.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
            <p className="text-sm text-gray-400">
              {category.unlocked_achievements} of {category.total_achievements} unlocked
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Progress Circle */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-700"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${category.completion_percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {category.completion_percentage}%
              </span>
            </div>
          </div>
          
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Category Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.achievements.map((achievementProgress) => (
              <AchievementCard
                key={achievementProgress.achievement.id}
                achievementProgress={achievementProgress}
                showProgress={showProgress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AchievementCategory
