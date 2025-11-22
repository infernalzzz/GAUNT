import { useState, useEffect } from 'react'
import { X, Trophy, CheckCircle, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LobbyReviewModalProps {
  isOpen: boolean
  onClose: () => void
  lobbyId: string | null
  onComplete: () => void
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
  winner_id?: string | null
}

interface Participant {
  id: string
  user_id: string
  joined_at: string
  status: 'active' | 'left' | 'disqualified'
  user: {
    username: string
    id: string
  }
}

const LobbyReviewModal = ({ isOpen, onClose, lobbyId, onComplete }: LobbyReviewModalProps) => {
  const [lobby, setLobby] = useState<LobbyDetails | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [pendingWinnerChange, setPendingWinnerChange] = useState<string | null>(null)
  const [isShowingConfirmModal, setIsShowingConfirmModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isUpdatingWinner, setIsUpdatingWinner] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if winner selection should be disabled (active lobbies only)
  const isWinnerSelectionDisabled = lobby && lobby.status !== 'completed' && lobby.status !== 'pending_admin_review'

  useEffect(() => {
    if (!isOpen || !lobbyId) return

    const fetchLobbyDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch lobby details
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
          setError('Failed to load lobby details')
          return
        }

        // Set winner if already set
        if (lobbyData.winner_id) {
          setSelectedWinner(lobbyData.winner_id)
        }

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('lobby_participants')
          .select(`
            *,
            user:users!lobby_participants_user_id_fkey(username, id)
          `)
          .eq('lobby_id', lobbyId)
          .eq('status', 'active')

        if (participantsError) {
          console.error('Error fetching participants:', participantsError)
        }

        setLobby({
          ...lobbyData,
          host_username: (lobbyData.host as any)?.username || 'Unknown',
          winner_id: lobbyData.winner_id || null
        })
        setParticipants(participantsData || [])
      } catch (err) {
        console.error('Error loading lobby review:', err)
        setError('Failed to load lobby details')
      } finally {
        setLoading(false)
      }
    }

    fetchLobbyDetails()
  }, [isOpen, lobbyId])

  const handleWinnerSelect = (userId: string) => {
    // If lobby is completed and trying to change winner, show confirmation
    if (lobby?.status === 'completed' && selectedWinner !== userId) {
      setPendingWinnerChange(userId)
      setIsShowingConfirmModal(true)
    } else if (!isWinnerSelectionDisabled) {
      // Only allow selection if not disabled (for pending_admin_review)
      setSelectedWinner(userId)
    }
  }

  const handleConfirmWinnerChange = async () => {
    if (!lobby || !pendingWinnerChange || !lobbyId) {
      setIsShowingConfirmModal(false)
      setPendingWinnerChange(null)
      return
    }

    try {
      setIsUpdatingWinner(true)

      // Update winner for completed lobby
      const { error: updateError } = await supabase
        .from('lobbies')
        .update({
          winner_id: pendingWinnerChange,
          updated_at: new Date().toISOString()
        })
        .eq('id', lobbyId)

      if (updateError) {
        console.error('Error updating winner:', updateError)
        alert(`Failed to update winner: ${updateError.message}`)
        setIsShowingConfirmModal(false)
        setPendingWinnerChange(null)
        return
      }

      // Log admin action (optional, don't fail if it errors)
      try {
        await supabase.rpc('log_admin_action', {
          action_type: 'change_winner',
          target_id: lobbyId,
          target_type: 'lobby',
          reason: `Changed winner from ${participants.find(p => p.user_id === selectedWinner)?.user.username || 'Unknown'} to ${participants.find(p => p.user_id === pendingWinnerChange)?.user.username || 'Unknown'}`
        })
      } catch (logError) {
        console.warn('Failed to log admin action:', logError)
      }

      // Update local state
      setSelectedWinner(pendingWinnerChange)
      setLobby({
        ...lobby,
        winner_id: pendingWinnerChange
      })

      alert('Winner updated successfully')
      onComplete() // Refresh the parent component
    } catch (err) {
      console.error('Error updating winner:', err)
      alert(`Failed to update winner: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUpdatingWinner(false)
      setIsShowingConfirmModal(false)
      setPendingWinnerChange(null)
    }
  }

  const handleCancelWinnerChange = () => {
    setIsShowingConfirmModal(false)
    setPendingWinnerChange(null)
  }

  const handleComplete = async () => {
    if (!lobby || !selectedWinner) {
      alert('Please select a winner before completing the lobby')
      return
    }

    if (!confirm('Are you sure you want to mark this lobby as completed? This action cannot be undone.')) {
      return
    }

    try {
      setIsCompleting(true)

      // Update lobby status to completed and set winner
      const { error: updateError } = await supabase
        .from('lobbies')
        .update({
          status: 'completed',
          winner_id: selectedWinner,
          updated_at: new Date().toISOString()
        })
        .eq('id', lobbyId)

      if (updateError) {
        console.error('Error completing lobby:', updateError)
        alert(`Failed to complete lobby: ${updateError.message}`)
        return
      }

      // Log admin action (optional, don't fail if it errors)
      try {
        await supabase.rpc('log_admin_action', {
          action_type: 'complete_lobby',
          target_id: lobbyId,
          target_type: 'lobby',
          reason: `Winner: ${participants.find(p => p.user_id === selectedWinner)?.user.username}`
        })
      } catch (logError) {
        console.warn('Failed to log admin action:', logError)
      }

      alert('Lobby marked as completed successfully')
      onComplete()
      onClose()
    } catch (err) {
      console.error('Error completing lobby:', err)
      alert(`Failed to complete lobby: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsCompleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Review Match</h2>
            <p className="text-gray-400 mt-1">Review lobby details and select winner</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading lobby details...</div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : lobby ? (
          <div className="space-y-6">
            {/* Lobby Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Lobby Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Game</div>
                  <div className="text-white font-medium">{lobby.game}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Title</div>
                  <div className="text-white font-medium">
                    {lobby.custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Price</div>
                  <div className="text-white font-medium">${lobby.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Region</div>
                  <div className="text-white font-medium">{lobby.region}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div className="text-white font-medium capitalize">{lobby.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Host</div>
                  <div className="text-white font-medium">{lobby.host_username}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Winner Payout</div>
                  <div className="text-green-400 font-bold">${lobby.winner_amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Created</div>
                  <div className="text-white font-medium">
                    {new Date(lobby.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Participants</h3>
              {participants.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No active participants</div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedWinner === participant.user_id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-white font-medium">
                              {participant.user.username}
                            </div>
                            <div className="text-sm text-gray-400">
                              Joined: {new Date(participant.joined_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleWinnerSelect(participant.user_id)}
                          disabled={isWinnerSelectionDisabled || selectedWinner === participant.user_id}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedWinner === participant.user_id
                              ? 'bg-green-600 text-white'
                              : isWinnerSelectionDisabled
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          title={isWinnerSelectionDisabled ? 'Winner selection is disabled for active lobbies' : selectedWinner === participant.user_id ? 'Current Winner' : lobby?.status === 'completed' ? 'Change Winner' : 'Select Winner'}
                        >
                          {selectedWinner === participant.user_id ? (
                            <>
                              <Trophy className="w-4 h-4 inline mr-2" />
                              Winner
                            </>
                          ) : (
                            lobby?.status === 'completed' ? 'Change Winner' : 'Select Winner'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Complete Button - Only for pending_admin_review lobbies */}
            {lobby.status === 'pending_admin_review' && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isCompleting || !selectedWinner}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCompleting ? (
                    'Completing...'
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 inline mr-2" />
                      Complete Lobby
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Info for active lobbies */}
            {isWinnerSelectionDisabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-lg text-center">
                Winner selection is only available for lobbies pending review. This lobby is still active.
              </div>
            )}

            {/* Info for completed lobbies */}
            {lobby.status === 'completed' && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg text-center">
                This lobby has already been completed.
                {lobby.winner_id && (
                  <div className="mt-2">
                    Winner: {participants.find(p => p.user_id === lobby.winner_id)?.user.username || 'Unknown'}
                  </div>
                )}
                {selectedWinner && selectedWinner !== lobby.winner_id && (
                  <div className="mt-2 text-sm">
                    You are about to change the winner. Please confirm to proceed.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Confirmation Modal for Changing Winner */}
      {isShowingConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Change Winner?</h3>
              <p className="text-gray-400">
                This game has already been reviewed and completed. Are you sure you want to change the winner?
              </p>
            </div>
            
            {pendingWinnerChange && selectedWinner && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-400 mb-2">Current Winner:</div>
                <div className="text-white font-medium mb-4">
                  {participants.find(p => p.user_id === selectedWinner)?.user.username || 'Unknown'}
                </div>
                <div className="text-sm text-gray-400 mb-2">New Winner:</div>
                <div className="text-green-400 font-medium">
                  {participants.find(p => p.user_id === pendingWinnerChange)?.user.username || 'Unknown'}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCancelWinnerChange}
                disabled={isUpdatingWinner}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWinnerChange}
                disabled={isUpdatingWinner}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isUpdatingWinner ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LobbyReviewModal
