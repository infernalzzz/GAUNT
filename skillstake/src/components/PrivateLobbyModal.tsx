import { useState, useEffect } from 'react'
import { X, Users, Copy, Share2, UserPlus } from 'lucide-react'
import { SocialService } from '../lib/services/socialService'
import type { UserProfile, LobbyInvite } from '../types/social'

interface PrivateLobbyModalProps {
  isOpen: boolean
  onClose: () => void
  lobbyId: string
  lobbyData?: any
}

const PrivateLobbyModal = ({ isOpen, onClose, lobbyId }: PrivateLobbyModalProps) => {
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [invites, setInvites] = useState<LobbyInvite[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [friendsData, invitesData] = await Promise.all([
        SocialService.getFriends(),
        SocialService.getLobbyInvites()
      ])
      
      setFriends(friendsData)
      setInvites(invitesData.filter(invite => invite.lobby_id === lobbyId))
      
      // Generate or get invite code
      setInviteCode(generateInviteCode())
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setIsLoading(false)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleInviteFriends = async () => {
    if (selectedFriends.length === 0) return

    try {
      for (const friendId of selectedFriends) {
        await SocialService.inviteToPrivateLobby(lobbyId, friendId)
      }
      
      setMessage({ type: 'success', text: `Invited ${selectedFriends.length} friends` })
      setSelectedFriends([])
      await loadData()
    } catch (error) {
      console.error('Error inviting friends:', error)
      setMessage({ type: 'error', text: 'Failed to send invitations' })
    }
  }

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setMessage({ type: 'success', text: 'Invite code copied to clipboard!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy invite code' })
    }
  }

  const handleShareLobby = async () => {
    const shareUrl = `${window.location.origin}/lobby/${lobbyId}?invite=${inviteCode}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my private lobby!',
          text: `Join my private lobby on GAUNT.GG`,
          url: shareUrl
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setMessage({ type: 'success', text: 'Lobby link copied to clipboard!' })
      }
    } catch (error) {
      console.error('Error sharing lobby:', error)
      setMessage({ type: 'error', text: 'Failed to share lobby' })
    }
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Private Lobby</h2>
            <p className="text-gray-400 mt-1">Invite friends to your private lobby</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
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

        {/* Invite Code Section */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Invite Code</h3>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-700 rounded-lg px-4 py-3">
              <code className="text-white font-mono text-lg">{inviteCode}</code>
            </div>
            <button
              onClick={handleCopyInviteCode}
              className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleShareLobby}
              className="flex items-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Share this code with friends to let them join your private lobby
          </p>
        </div>

        {/* Friends Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Invite Friends</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading friends...</div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No friends yet</p>
              <p className="text-gray-500 text-sm">Add friends to invite them to your lobby</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {friend.display_name?.charAt(0) || friend.username.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{friend.display_name || friend.username}</p>
                      <p className="text-gray-400 text-sm">
                        {friend.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFriendSelection(friend.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedFriends.includes(friend.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedFriends.includes(friend.id) ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFriends.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleInviteFriends}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite {selectedFriends.length} Friends</span>
              </button>
            </div>
          )}
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Pending Invites</h3>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {invite.invited_user?.display_name?.charAt(0) || invite.invited_user?.username?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {invite.invited_user?.display_name || invite.invited_user?.username}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Invited {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    invite.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    invite.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {invite.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrivateLobbyModal
