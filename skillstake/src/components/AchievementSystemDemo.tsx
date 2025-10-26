import { useState } from 'react'
import { Trophy, Star, Zap, Target } from 'lucide-react'

/**
 * Demo component to showcase the achievement system
 * This can be used for testing or as a preview
 */
const AchievementSystemDemo = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const demoAchievements = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Play your first match',
      icon: '🎮',
      category: 'matches',
      rarity: 'common',
      points: 10,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1
    },
    {
      id: '2',
      name: 'Rising Star',
      description: 'Win 10 matches',
      icon: '⭐',
      category: 'wins',
      rarity: 'common',
      points: 30,
      isUnlocked: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: '3',
      name: 'Hot Streak',
      description: 'Win 5 matches in a row',
      icon: '🔥',
      category: 'streaks',
      rarity: 'rare',
      points: 40,
      isUnlocked: false,
      progress: 3,
      maxProgress: 5
    },
    {
      id: '4',
      name: 'Valorant Master',
      description: 'Win 50 Valorant matches',
      icon: '🎯',
      category: 'game_specific',
      rarity: 'epic',
      points: 100,
      isUnlocked: false,
      progress: 12,
      maxProgress: 50
    }
  ]

  const categories = [
    { name: 'All', icon: Trophy, value: 'all' },
    { name: 'Matches', icon: Target, value: 'matches' },
    { name: 'Wins', icon: Star, value: 'wins' },
    { name: 'Streaks', icon: Zap, value: 'streaks' }
  ]

  const filteredAchievements = selectedCategory === 'all' 
    ? demoAchievements 
    : demoAchievements.filter(a => a.category === selectedCategory)

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Achievement System Demo</h2>
        <p className="text-gray-400">Preview of the achievement system features</p>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <category.icon className="w-4 h-4" />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative rounded-lg border-2 p-4 transition-all duration-300 ${
              achievement.isUnlocked 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-gray-700 bg-gray-800/50'
            }`}
          >
            {/* Achievement Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{achievement.icon}</div>
                <div>
                  <h3 className={`font-semibold ${
                    achievement.isUnlocked ? 'text-white' : 'text-gray-400'
                  }`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm ${
                    achievement.rarity === 'common' ? 'text-gray-400' :
                    achievement.rarity === 'rare' ? 'text-blue-400' :
                    achievement.rarity === 'epic' ? 'text-purple-400' :
                    'text-yellow-400'
                  }`}>
                    {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  {achievement.points}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className={`text-sm mb-3 ${
              achievement.isUnlocked ? 'text-gray-300' : 'text-gray-500'
            }`}>
              {achievement.description}
            </p>

            {/* Progress Bar */}
            {!achievement.isUnlocked && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((achievement.progress / achievement.maxProgress) * 100)}% complete
                </div>
              </div>
            )}

            {/* Unlocked Status */}
            {achievement.isUnlocked && (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Unlocked</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* System Features */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Real-time notifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Progress tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Multiple categories</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Rarity system</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Leaderboards</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Game-specific achievements</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AchievementSystemDemo
