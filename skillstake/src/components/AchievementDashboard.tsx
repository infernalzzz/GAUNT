import { useState, useEffect } from 'react'
import { Trophy, Star, TrendingUp, Users } from 'lucide-react'
import AchievementCategory from './AchievementCategory'
import { AchievementService } from '../lib/services/achievementService'
import type { AchievementCategory as AchievementCategoryType, AchievementNotification } from '../types/achievements'

const AchievementDashboard = () => {
  const [categories, setCategories] = useState<AchievementCategoryType[]>([])
  const [recentAchievements, setRecentAchievements] = useState<AchievementNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'recent'>('overview')

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      
      // Get current user ID (you'll need to implement this based on your auth system)
      const { data: { user } } = await (await import('../lib/supabase')).supabase.auth.getUser()
      if (!user) return

      const [categoriesData, recentData] = await Promise.all([
        AchievementService.getAchievementsByCategory(user.id),
        AchievementService.getRecentAchievements(user.id, 6)
      ])

      setCategories(categoriesData)
      setRecentAchievements(recentData)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAchievements = categories.reduce((sum, cat) => sum + cat.total_achievements, 0)
  const unlockedAchievements = categories.reduce((sum, cat) => sum + cat.unlocked_achievements, 0)
  const totalPoints = categories.reduce((sum, cat) => 
    sum + cat.achievements
      .filter(a => a.is_unlocked)
      .reduce((points, a) => points + a.achievement.points, 0), 0
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading achievements...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Achievements</h1>
          <p className="text-gray-400">Track your progress and unlock rewards</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{unlockedAchievements}</p>
                <p className="text-gray-400">Achievements Unlocked</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalPoints}</p>
                <p className="text-gray-400">Total Points</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0}%
                </p>
                <p className="text-gray-400">Completion Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
                <p className="text-gray-400">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Recent
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {categories.map((category) => (
              <AchievementCategory
                key={category.name}
                category={category}
                showProgress={true}
              />
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            {categories.map((category) => (
              <AchievementCategory
                key={category.name}
                category={category}
                showProgress={true}
              />
            ))}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentAchievements.map((notification) => (
              <div key={notification.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{notification.achievement.name}</h3>
                    <p className="text-gray-400 text-sm">{notification.achievement.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold">+{notification.achievement.points} points</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(notification.unlocked_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Achievements Yet</h3>
            <p className="text-gray-400">Start playing matches to unlock your first achievement!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AchievementDashboard
