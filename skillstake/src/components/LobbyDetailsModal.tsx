import { useState, useEffect } from 'react'
import { X, DollarSign, MapPin, Monitor, User, FileText, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LobbyService } from '../lib/services/lobbyService'

interface LobbyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  lobbyId: string | null
  onLobbyJoined?: () => void
}

interface LobbyDetails {
  id: string
  game: string
  custom_title?: string
  price: number
  region: string
  pot: number
  platform_fee: number
  bond_per_player: number
  winner_amount: number
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'pending_admin_review'
  created_at: string
  created_by?: string
  max_players: number
  current_players: number
  host_username?: string
  game_id?: string
}

interface LobbyParticipant {
  id: string
  user_id: string
  joined_at: string
  status: 'active' | 'left' | 'disqualified'
  user: {
    username: string
    display_name?: string
    is_verified: boolean
    steam_linked: boolean
    dispute_rate: number
  }
}

const LobbyDetailsModal = ({ isOpen, onClose, lobbyId, onLobbyJoined }: LobbyDetailsModalProps) => {
  const [lobby, setLobby] = useState<LobbyDetails | null>(null)
  const [participants, setParticipants] = useState<LobbyParticipant[]>([])
  const [loading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [fairPlayCommitments, setFairPlayCommitments] = useState({
    noSmurfing: false,
    connectionQuality: false,
    proofOfResults: false
  })
  const [gameId, setGameId] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    if (!isOpen || !lobbyId) {
      // Reset state when modal closes
      if (!isOpen) {
        setFairPlayCommitments({
          noSmurfing: false,
          connectionQuality: false,
          proofOfResults: false
        })
        setGameId('')
      }
      return
    }

    const fetchLobbyDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser)

        // Fetch lobby details with host information
        const { data: lobbyData, error: lobbyError } = await supabase
          .from('lobbies')
          .select(`
            *,
            host:users!lobbies_created_by_fkey(username)
          `)
          .eq('id', lobbyId)
          .single()

        if (lobbyError) {
          console.error('Error fetching lobby:', lobbyError)
          setError('Lobby not found')
          return
        }

        // Fetch participants with user details
        console.log('🔍 Fetching participants for lobby:', lobbyId)
        const { data: participantsData, error: participantsError } = await supabase
          .from('lobby_participants')
          .select(`
            *,
            user:users!lobby_participants_user_id_fkey(username, display_name, is_verified, steam_linked, dispute_rate)
          `)
          .eq('lobby_id', lobbyId)
          .eq('status', 'active')

        if (participantsError) {
          console.error('❌ Error fetching participants:', participantsError)
          // Don't fail completely if participants fetch fails - lobby can still be shown
        } else {
          console.log('✅ Participants fetched:', participantsData)
        }

        // Handle host data - it might be an object or array
        const host = Array.isArray(lobbyData.host) ? lobbyData.host[0] : lobbyData.host
        
        setLobby({
          ...lobbyData,
          host_username: host?.username || 'Unknown'
        })

        // Handle participants data - ensure user data is properly accessed
        const processedParticipants = (participantsData || []).map((p: any) => {
          const user = Array.isArray(p.user) ? p.user[0] : p.user
          return {
            ...p,
            user: user || {
              username: 'Unknown',
              display_name: 'Unknown',
              is_verified: false,
              steam_linked: false,
              dispute_rate: 0
            }
          }
        })

        setParticipants(processedParticipants)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load lobby details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLobbyDetails()
  }, [isOpen, lobbyId])

  // Real-time updates for the specific lobby
  useEffect(() => {
    if (!isOpen || !lobbyId) return

    const channel = supabase
      .channel(`lobby-${lobbyId}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`
        }, 
        async (payload) => {
          console.log('🔄 Lobby details change detected:', payload)
          
          // Reload the specific lobby details and participants
          try {
            const { data: lobbyData, error: lobbyError } = await supabase
              .from('lobbies')
              .select(`
                *,
                host:users!lobbies_created_by_fkey(username)
              `)
              .eq('id', lobbyId)
              .single()

            // Fetch updated participants
            const { data: participantsData, error: _participantsError } = await supabase
              .from('lobby_participants')
              .select(`
                *,
                user:users!lobby_participants_user_id_fkey(username, display_name, is_verified, steam_linked, dispute_rate)
              `)
              .eq('lobby_id', lobbyId)
              .eq('status', 'active')

            if (!lobbyError && lobbyData) {
              const host = Array.isArray(lobbyData.host) ? lobbyData.host[0] : lobbyData.host
              setLobby({
                ...lobbyData,
                host_username: host?.username || 'Unknown'
              })
              const processedParticipants = (participantsData || []).map((p: any) => {
                const user = Array.isArray(p.user) ? p.user[0] : p.user
                return {
                  ...p,
                  user: user || {
                    username: 'Unknown',
                    display_name: 'Unknown',
                    is_verified: false,
                    steam_linked: false,
                    dispute_rate: 0
                  }
                }
              })
              setParticipants(processedParticipants)
              console.log('✅ Lobby details and participants updated in real-time')
            }
          } catch (err) {
            console.error('❌ Error updating lobby details:', err)
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lobby_participants',
          filter: `lobby_id=eq.${lobbyId}`
        }, 
        async (payload) => {
          console.log('🔄 Lobby participants change detected:', payload)
          
          // Reload participants when someone joins/leaves
          try {
            const { data: participantsData, error: _participantsError } = await supabase
              .from('lobby_participants')
              .select(`
                *,
                user:users!lobby_participants_user_id_fkey(username, display_name, is_verified, steam_linked, dispute_rate)
              `)
              .eq('lobby_id', lobbyId)
              .eq('status', 'active')

            if (!_participantsError) {
              const processedParticipants = (participantsData || []).map((p: any) => {
                const user = Array.isArray(p.user) ? p.user[0] : p.user
                return {
                  ...p,
                  user: user || {
                    username: 'Unknown',
                    display_name: 'Unknown',
                    is_verified: false,
                    steam_linked: false,
                    dispute_rate: 0
                  }
                }
              })
              setParticipants(processedParticipants)
              console.log('✅ Participants updated in real-time:', processedParticipants)
            } else {
              console.error('❌ Error updating participants in real-time:', _participantsError)
            }
          } catch (err) {
            console.error('❌ Error updating participants:', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, lobbyId])

  const handleJoinClick = () => {
    const allCommitmentsAccepted = fairPlayCommitments.noSmurfing && 
                                    fairPlayCommitments.connectionQuality && 
                                    fairPlayCommitments.proofOfResults
    
    if (!allCommitmentsAccepted) {
      alert('Please accept all fair play commitments before joining.')
      return
    }
    
    // Join directly without showing confirmation modal
    handleJoinLobby()
  }

  const handleJoinLobby = async () => {
    if (!lobby || !user || !lobbyId) return

    setIsJoining(true)
    try {
      await LobbyService.joinLobby(lobby.id)
      
      // Refresh lobby data
      const { data: updatedLobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select(`
          *,
          host:users!lobbies_created_by_fkey(username)
        `)
        .eq('id', lobby.id)
        .single()

      // Refresh participants data
      const { data: participantsData, error: participantsError } = await supabase
        .from('lobby_participants')
        .select(`
          *,
          user:users!lobby_participants_user_id_fkey(username, display_name, is_verified, steam_linked, dispute_rate)
        `)
        .eq('lobby_id', lobbyId)
        .eq('status', 'active')

      if (updatedLobby && !lobbyError) {
        const host = Array.isArray(updatedLobby.host) ? updatedLobby.host[0] : updatedLobby.host
        setLobby({
          ...updatedLobby,
          host_username: host?.username || 'Unknown'
        })
      }

      if (!participantsError && participantsData) {
        // Handle participants data - ensure user data is properly accessed
        const processedParticipants = (participantsData || []).map((p: any) => {
          const user = Array.isArray(p.user) ? p.user[0] : p.user
          return {
            ...p,
            user: user || {
              username: 'Unknown',
              display_name: 'Unknown',
              is_verified: false,
              steam_linked: false,
              dispute_rate: 0
            }
          }
        })
        setParticipants(processedParticipants)
      }
      
      // Reset commitments after successful join
      setFairPlayCommitments({
        noSmurfing: false,
        connectionQuality: false,
        proofOfResults: false
      })
      
      // Notify parent component to refresh lobbies list
      if (onLobbyJoined) {
        onLobbyJoined()
      }
    } catch (err) {
      console.error('Error joining lobby:', err)
      alert('Failed to join lobby. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-gradient-to-r from-blue-500 to-blue-600'
      case 'in_progress':
        return 'bg-gradient-to-r from-orange-500 to-red-500'
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-green-600'
      case 'pending_admin_review':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500'
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'pending_admin_review':
        return 'Pending Admin Review'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const handleCompleteGame = async () => {
    if (!lobby || !gameId.trim()) {
      alert('Please enter a game ID to complete the game.')
      return
    }

    if (!user) {
      alert('You must be logged in to complete the game.')
      return
    }

    setIsCompleting(true)
    try {
      const { error, data } = await supabase
        .from('lobbies')
        .update({
          status: 'pending_admin_review',
          game_id: gameId.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id)
        .select()

      if (error) {
        console.error('Error completing game:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw new Error(error.message || 'Failed to update lobby status')
      }

      if (!data || data.length === 0) {
        throw new Error('Lobby update returned no data. You may not have permission to update this lobby.')
      }

      // Refresh lobby data
      const { data: updatedLobby } = await supabase
        .from('lobbies')
        .select(`
          *,
          host:users!lobbies_created_by_fkey(username)
        `)
        .eq('id', lobby.id)
        .single()

      if (updatedLobby) {
        const host = Array.isArray(updatedLobby.host) ? updatedLobby.host[0] : updatedLobby.host
        setLobby({
          ...updatedLobby,
          host_username: host?.username || 'Unknown'
        })
      }

      // Reset game ID input
      setGameId('')

      // Notify parent component to refresh lobbies list
      if (onLobbyJoined) {
        onLobbyJoined()
      }
    } catch (err: any) {
      console.error('Error completing game:', err)
      const errorMessage = err?.message || err?.error?.message || 'Failed to complete game. Please try again.'
      alert(errorMessage)
    } finally {
      setIsCompleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎮</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{lobby?.game || 'Loading...'}</h2>
              <p className="text-gray-400">Lobby #{lobbyId?.slice(0, 8) || '...'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {loading && (
            <div className="text-center py-8">
              <div className="text-white">Loading lobby details...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={onClose}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {lobby && !loading && !error && (
            <>
              {/* Status Badge */}
              <div className="flex justify-end mb-6">
                <span className={`px-4 py-2 rounded-lg text-white font-medium ${getStatusColor(lobby.status)}`}>
                  {getStatusText(lobby.status)}
                </span>
              </div>

              {/* Custom Title */}
              {lobby.custom_title && (
                <h3 className="text-xl font-semibold text-white mb-6">{lobby.custom_title}</h3>
              )}

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Buy-in</p>
                      <p className="text-green-400 text-2xl font-bold">${lobby.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Region</p>
                      <p className="text-white font-medium">{lobby.region}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Platform</p>
                      <p className="text-white font-medium">Riot</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Host</p>
                      <p className="text-white font-medium">{lobby.host_username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Players</p>
                      <p className="text-white font-medium">{lobby.current_players}/{lobby.max_players}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Rules */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Match Rules</h4>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-300">
                    Highest placement in shared lobby
                  </p>
                </div>
              </div>

              {/* Participants */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold text-white">Participants ({participants.length}/{lobby.max_players})</h4>
                  </div>
                  {participants.length < lobby.max_players && (
                    <div className="text-gray-400 text-sm">Waiting for challenger...</div>
                  )}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  {participants.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400">No participants yet</p>
                      <p className="text-gray-500 text-sm">Be the first to join this lobby!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div key={participant.id} className="p-4 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-green-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {participant.user?.display_name || participant.user?.username || 'Unknown User'}
                                  {lobby?.created_by === participant.user_id && (
                                    <span className="ml-2 px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded-full">Host</span>
                                  )}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  Joined {new Date(participant.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Active
                              </span>
                            </div>
                          </div>
                          
                          {/* Verification Details */}
                          {participant.user && (
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${participant.user.is_verified ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                <span className={`${participant.user.is_verified ? 'text-green-400' : 'text-gray-400'}`}>
                                  Verified ID (KYC)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${participant.user.steam_linked ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                <span className={`${participant.user.steam_linked ? 'text-green-400' : 'text-gray-400'}`}>
                                  Linked Steam
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${(participant.user.dispute_rate || 0) < 0.1 ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                <span className={`${(participant.user.dispute_rate || 0) < 0.1 ? 'text-green-400' : 'text-gray-400'}`}>
                                  Low Dispute Rate
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Payout Breakdown */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Payout Breakdown</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Buy-in (per player)</span>
                    <span className="text-white font-medium">${lobby.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Players</span>
                    <span className="text-white font-medium">{lobby.max_players}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Total Pot</span>
                    <span className="text-white font-medium">${lobby.pot.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Platform fee (10%)</span>
                    <span className="text-orange-400 font-medium">-${lobby.platform_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-300 font-semibold">Winner Payout</span>
                    <span className="text-green-400 font-bold text-xl">${lobby.winner_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Fair Play Commitments */}
              {lobby.status === 'waiting' && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h4 className="text-lg font-semibold text-white">Fair Play Commitments</h4>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <label className={`flex items-start space-x-3 ${(!user || lobby.current_players >= lobby.max_players) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={fairPlayCommitments.noSmurfing}
                        onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, noSmurfing: e.target.checked }))}
                        disabled={!user || lobby.current_players >= lobby.max_players}
                        className="w-4 h-4 text-blue-600 mt-1 disabled:cursor-not-allowed"
                      />
                      <div>
                        <div className="text-white font-medium">No Smurfing or Account Boosting</div>
                        <div className="text-sm text-gray-400">I will play on my main account with accurate rank/MMR.</div>
                      </div>
                    </label>
                    <label className={`flex items-start space-x-3 ${(!user || lobby.current_players >= lobby.max_players) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={fairPlayCommitments.connectionQuality}
                        onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, connectionQuality: e.target.checked }))}
                        disabled={!user || lobby.current_players >= lobby.max_players}
                        className="w-4 h-4 text-blue-600 mt-1 disabled:cursor-not-allowed"
                      />
                      <div>
                        <div className="text-white font-medium">Acceptable Connection Quality</div>
                        <div className="text-sm text-gray-400">I have stable connection with &lt;100ms ping to selected region.</div>
                      </div>
                    </label>
                    <label className={`flex items-start space-x-3 ${(!user || lobby.current_players >= lobby.max_players) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={fairPlayCommitments.proofOfResults}
                        onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, proofOfResults: e.target.checked }))}
                        disabled={!user || lobby.current_players >= lobby.max_players}
                        className="w-4 h-4 text-blue-600 mt-1 disabled:cursor-not-allowed"
                      />
                      <div>
                        <div className="text-white font-medium">Proof of Match Results</div>
                        <div className="text-sm text-gray-400">I will provide screenshots/video if match result is disputed.</div>
                      </div>
                    </label>
                    {!user && (
                      <div className="text-sm text-yellow-400 mt-2">
                        Please log in to accept these commitments and join the lobby.
                      </div>
                    )}
                    {user && lobby.current_players >= lobby.max_players && (
                      <div className="text-sm text-gray-400 mt-2">
                        This lobby is full and cannot be joined.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Game Completion Section - For in_progress lobbies (participants only) */}
              {user && lobby.status === 'in_progress' && participants.some(p => p.user_id === user.id) && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-orange-400" />
                      <h4 className="text-lg font-semibold text-white">Game Completion</h4>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      Enter the Game ID/Match ID after completing your game. The lobby will be sent for admin review.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Game ID / Match ID
                        </label>
                        <input
                          type="text"
                          value={gameId}
                          onChange={(e) => setGameId(e.target.value)}
                          placeholder="Enter game/match ID"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          disabled={isCompleting}
                        />
                      </div>
                      <button
                        onClick={handleCompleteGame}
                        disabled={isCompleting || !gameId.trim()}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                      >
                        {isCompleting ? 'Submitting...' : 'Complete Game'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
                {user && lobby.status === 'waiting' && lobby.current_players < lobby.max_players && (
                  <button
                    onClick={handleJoinClick}
                    disabled={isJoining || !fairPlayCommitments.noSmurfing || !fairPlayCommitments.connectionQuality || !fairPlayCommitments.proofOfResults}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isJoining ? 'Joining...' : 'Join Lobby'}
                  </button>
                )}
                {!user && lobby.status === 'waiting' && (
                  <button
                    onClick={onClose}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Login to Join
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LobbyDetailsModal
