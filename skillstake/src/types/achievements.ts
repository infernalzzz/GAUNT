// Achievement System Types

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'matches' | 'wins' | 'streaks' | 'earnings' | 'game_specific' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  requirements: AchievementRequirements
  is_hidden: boolean
  created_at: string
}

export interface AchievementRequirements {
  min_matches?: number
  min_wins?: number
  min_streak?: number
  min_earnings?: number
  game?: string
  early_adopter?: boolean
  first_day_streak?: number
  comeback?: boolean
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress?: Record<string, any>
  achievement?: Achievement
}

export interface UserStats {
  id: string
  user_id: string
  total_matches: number
  total_wins: number
  total_losses: number
  current_win_streak: number
  longest_win_streak: number
  total_earnings: number
  matches_by_game: Record<string, number>
  wins_by_game: Record<string, number>
  created_at: string
  updated_at: string
}

export interface AchievementProgress {
  achievement: Achievement
  progress: number
  max_progress: number
  percentage: number
  is_unlocked: boolean
  unlocked_at?: string
}

export interface AchievementCategory {
  name: string
  icon: string
  achievements: AchievementProgress[]
  total_achievements: number
  unlocked_achievements: number
  completion_percentage: number
}

export interface AchievementNotification {
  id: string
  achievement: Achievement
  unlocked_at: string
  is_read: boolean
}
