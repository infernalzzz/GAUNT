import { AchievementService } from '../services/achievementService'

/**
 * Utility functions to integrate achievement tracking into the lobby system
 */

export class AchievementIntegration {
  /**
   * Track match completion and update user stats
   * Call this when a match is completed
   */
  static async trackMatchCompletion(
    userId: string,
    matchResult: 'win' | 'loss',
    game: string,
    earnings: number = 0
  ): Promise<void> {
    try {
      // Update user stats
      await AchievementService.updateUserStats(userId, matchResult, game, earnings)
      
      // Check for new achievements
      const newAchievements = await AchievementService.checkNewAchievements(userId)
      
      if (newAchievements.length > 0) {
        console.log(`🎉 User ${userId} unlocked ${newAchievements.length} new achievements!`)
        // The AchievementTracker component will automatically show notifications
        // via the real-time subscription
      }
    } catch (error) {
      console.error('Error tracking match completion:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Track lobby creation
   * Call this when a user creates a lobby
   */
  static async trackLobbyCreation(userId: string, game: string): Promise<void> {
    try {
      // This could trigger special achievements like "First Lobby Creator"
      // For now, we'll just log it
      console.log(`User ${userId} created a lobby for ${game}`)
    } catch (error) {
      console.error('Error tracking lobby creation:', error)
    }
  }

  /**
   * Track lobby joining
   * Call this when a user joins a lobby
   */
  static async trackLobbyJoin(userId: string, game: string): Promise<void> {
    try {
      // This could trigger special achievements like "First Join"
      console.log(`User ${userId} joined a lobby for ${game}`)
    } catch (error) {
      console.error('Error tracking lobby join:', error)
    }
  }

  /**
   * Track special events
   * Call this for special achievements that require custom logic
   */
  static async trackSpecialEvent(
    userId: string,
    eventType: 'first_day_streak' | 'comeback' | 'early_adopter',
    data?: any
  ): Promise<void> {
    try {
      // This would be used for special achievements that need custom tracking
      console.log(`User ${userId} triggered special event: ${eventType}`, data)
    } catch (error) {
      console.error('Error tracking special event:', error)
    }
  }
}

/**
 * Hook to easily integrate achievement tracking into components
 */
export const useAchievementTracking = () => {
  const trackMatch = async (
    userId: string,
    matchResult: 'win' | 'loss',
    game: string,
    earnings: number = 0
  ) => {
    await AchievementIntegration.trackMatchCompletion(userId, matchResult, game, earnings)
  }

  const trackLobbyCreation = async (userId: string, game: string) => {
    await AchievementIntegration.trackLobbyCreation(userId, game)
  }

  const trackLobbyJoin = async (userId: string, game: string) => {
    await AchievementIntegration.trackLobbyJoin(userId, game)
  }

  const trackSpecialEvent = async (
    userId: string,
    eventType: 'first_day_streak' | 'comeback' | 'early_adopter',
    data?: any
  ) => {
    await AchievementIntegration.trackSpecialEvent(userId, eventType, data)
  }

  return {
    trackMatch,
    trackLobbyCreation,
    trackLobbyJoin,
    trackSpecialEvent
  }
}
