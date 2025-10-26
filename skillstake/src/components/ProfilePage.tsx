import { useState, useEffect } from 'react'
import { User, Trophy, Target, Copy, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AchievementDashboard from './AchievementDashboard'

interface UserProfile {
  id: string
  email: string
  username: string
  display_name: string
  steam_id: string | null
  riot_id: string | null
  referral_code: string
  matches_played: number
  wins: number
  created_at: string
}

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements'>('profile')

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        setUser(authUser)

        const { data: profileData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        setProfile(profileData)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleCopyReferralLink = async () => {
    if (!profile?.referral_code) return

    const referralLink = `${window.location.origin}?ref=${profile.referral_code}`
    
    try {
      await navigator.clipboard.writeText(referralLink)
      setMessage({ type: 'success', text: 'Referral link copied to clipboard!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy link' })
    }
  }

  const winRate = profile?.matches_played && profile.matches_played > 0
    ? ((profile.wins / profile.matches_played) * 100).toFixed(1)
    : '0.0'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Please log in to view your profile</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Achievements
          </button>
        </div>

        {activeTab === 'achievements' ? (
          <AchievementDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
                  <p className="text-gray-400">{profile.email}</p>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
                    : 'bg-red-900/20 text-red-400 border border-red-500/20'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Display Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.display_name}
                  disabled
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                />
              </div>

              {/* Username (read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username (read-only)
                </label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                />
              </div>

              {/* Email (read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                />
              </div>

              {/* Role */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 border border-blue-500/20">
                  <span className="text-blue-400 text-sm font-medium">user</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column - Statistics, Game IDs, Referral */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Statistics</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Matches Played</span>
                  <span className="text-white font-medium">{profile.matches_played}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Wins</span>
                  <span className="text-green-400 font-medium">{profile.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-blue-400 font-medium">{winRate}%</span>
                </div>
              </div>
            </div>

            {/* Game IDs */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Game IDs</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Steam ID
                  </label>
                  <input
                    type="text"
                    value={profile.steam_id || 'Not connected'}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Riot ID
                  </label>
                  <input
                    type="text"
                    value={profile.riot_id || 'Not connected'}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Referral */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Copy className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Referral</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Referral Code
                  </label>
                  <input
                    type="text"
                    value={profile.referral_code || 'Not generated'}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400"
                  />
                </div>
                <button
                  onClick={handleCopyReferralLink}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Your Referral Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage