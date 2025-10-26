import { supabase } from '../supabase'
import type { 
  Achievement, 
  UserAchievement, 
  UserStats, 
  AchievementProgress, 
  AchievementCategory,
  AchievementNotification 
} from '../../types/achievements'

export class AchievementService {
  // Get all achievements
  static async getAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching achievements:', err)
      return []
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching user achievements:', err)
      return []
    }
  }

  // Get user stats
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      console.error('Error fetching user stats:', err)
      return null
    }
  }

  // Get achievement progress for user
  static async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    try {
      const [achievements, userAchievements, userStats] = await Promise.all([
        this.getAchievements(),
        this.getUserAchievements(userId),
        this.getUserStats(userId)
      ])

      const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id))
      const stats = userStats || {
        total_matches: 0,
        total_wins: 0,
        current_win_streak: 0,
        longest_win_streak: 0,
        total_earnings: 0,
        matches_by_game: {},
        wins_by_game: {}
      }

      return achievements.map(achievement => {
        const isUnlocked = unlockedAchievementIds.has(achievement.id)
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
        
        let progress = 0
        let maxProgress = 1

        // Calculate progress based on achievement requirements
        switch (achievement.category) {
          case 'matches':
            progress = stats.total_matches
            maxProgress = achievement.requirements.min_matches || 1
            break
          case 'wins':
            progress = stats.total_wins
            maxProgress = achievement.requirements.min_wins || 1
            break
          case 'streaks':
            progress = stats.longest_win_streak
            maxProgress = achievement.requirements.min_streak || 1
            break
          case 'earnings':
            progress = stats.total_earnings
            maxProgress = achievement.requirements.min_earnings || 1
            break
          case 'game_specific':
            const game = achievement.requirements.game
            if (game) {
              progress = (stats.matches_by_game as Record<string, number>)[game] || 0
              maxProgress = achievement.requirements.min_matches || 1
            }
            break
          default:
            progress = isUnlocked ? 1 : 0
            maxProgress = 1
        }

        const percentage = Math.min(100, Math.round((progress / maxProgress) * 100))

        return {
          achievement,
          progress,
          max_progress: maxProgress,
          percentage,
          is_unlocked: isUnlocked,
          unlocked_at: userAchievement?.unlocked_at
        }
      })
    } catch (err) {
      console.error('Error getting achievement progress:', err)
      return []
    }
  }

  // Get achievements grouped by category
  static async getAchievementsByCategory(userId: string): Promise<AchievementCategory[]> {
    try {
      const progress = await this.getAchievementProgress(userId)
      
      const categories = ['matches', 'wins', 'streaks', 'earnings', 'game_specific', 'special']
      const categoryIcons = {
        matches: '🎮',
        wins: '🏆',
        streaks: '🔥',
        earnings: '💰',
        game_specific: '🎯',
        special: '⭐'
      }

      return categories.map(categoryName => {
        const categoryAchievements = progress.filter(p => p.achievement.category === categoryName)
        const unlockedCount = categoryAchievements.filter(p => p.is_unlocked).length
        const totalCount = categoryAchievements.length
        const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

        return {
          name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace('_', ' '),
          icon: categoryIcons[categoryName as keyof typeof categoryIcons],
          achievements: categoryAchievements,
          total_achievements: totalCount,
          unlocked_achievements: unlockedCount,
          completion_percentage: completionPercentage
        }
      }).filter(category => category.total_achievements > 0)
    } catch (err) {
      console.error('Error getting achievements by category:', err)
      return []
    }
  }

  // Update user stats after match completion
  static async updateUserStats(
    userId: string, 
    matchResult: 'win' | 'loss', 
    game: string, 
    earnings: number = 0
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_user_stats', {
        p_user_id: userId,
        p_match_result: matchResult,
        p_game: game,
        p_earnings: earnings
      })

      if (error) throw error
    } catch (err) {
      console.error('Error updating user stats:', err)
      throw err
    }
  }

  // Check for new achievements (called after stats update)
  static async checkNewAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase.rpc('check_achievements', {
        user_id: userId
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error checking achievements:', err)
      return []
    }
  }

  // Get recent achievement notifications
  static async getRecentAchievements(userId: string, limit: number = 5): Promise<AchievementNotification[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          unlocked_at,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      return (data || []).map(item => ({
        id: item.id,
        achievement: item.achievement,
        unlocked_at: item.unlocked_at,
        is_read: false
      }))
    } catch (err) {
      console.error('Error getting recent achievements:', err)
      return []
    }
  }

  // Get achievement leaderboard
  static async getAchievementLeaderboard(limit: number = 10): Promise<Array<{
    user_id: string
    username: string
    total_achievements: number
    total_points: number
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievement:achievements(points),
          user:users(username)
        `)

      if (error) throw error

      // Group by user and calculate totals
      const userTotals = new Map<string, { username: string, achievements: number, points: number }>()
      
      data?.forEach(item => {
        const userId = item.user_id
        const username = item.user?.username || 'Unknown'
        const points = item.achievement?.points || 0

        if (!userTotals.has(userId)) {
          userTotals.set(userId, { username, achievements: 0, points: 0 })
        }

        const userTotal = userTotals.get(userId)!
        userTotal.achievements += 1
        userTotal.points += points
      })

      // Convert to array and sort by points
      return Array.from(userTotals.entries())
        .map(([user_id, totals]) => ({
          user_id,
          username: totals.username,
          total_achievements: totals.achievements,
          total_points: totals.points
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
    } catch (err) {
      console.error('Error getting achievement leaderboard:', err)
      return []
    }
  }
}
