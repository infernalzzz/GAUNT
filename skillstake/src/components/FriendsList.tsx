import { useState, useEffect } from 'react'
import { Users, UserPlus, Search, MoreVertical, Circle, Check, X } from 'lucide-react'
import { SocialService } from '../lib/services/socialService'
import type { UserProfile, Friend } from '../types/social'

const FriendsList = () => {
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [friendRequests, setFriendRequests] = useState<{ sent: Friend[], received: Friend[] }>({ sent: [], received: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFriendsData()
  }, [])

  const loadFriendsData = async () => {
    try {
      setLoading(true)
      const [friendsData, requestsData] = await Promise.all([
        SocialService.getFriends(),
        SocialService.getFriendRequests()
      ])
      
      setFriends(friendsData)
      setFriendRequests(requestsData)
    } catch (error) {
      console.error('Error loading friends data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const results = await SocialService.searchUsers(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await SocialService.sendFriendRequest(userId)
      await loadFriendsData()
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  const handleAcceptFriendRequest = async (friendId: string) => {
    try {
      await SocialService.acceptFriendRequest(friendId)
      await loadFriendsData()
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await SocialService.removeFriend(friendId)
      await loadFriendsData()
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'away': return 'text-yellow-400'
      case 'busy': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    return (
      <Circle 
        className={`w-3 h-3 ${getStatusColor(status)}`} 
        fill="currentColor"
      />
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-white">Loading friends...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Friends</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('search')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Requests ({friendRequests.received.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No friends yet</p>
                <p className="text-gray-500 text-sm">Add friends to start playing together!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {friend.display_name?.charAt(0) || friend.username.charAt(0)}
                        </span>
                      </div>
                      {friend.status && (
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusIcon(friend.status)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{friend.display_name || friend.username}</p>
                      <p className="text-gray-400 text-sm">
                        {friend.status === 'online' ? 'Online' : 
                         friend.last_seen ? `Last seen ${new Date(friend.last_seen).toLocaleDateString()}` : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Received Requests */}
            {friendRequests.received.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Received Requests</h3>
                <div className="space-y-3">
                  {friendRequests.received.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {request.user?.display_name?.charAt(0) || request.user?.username?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {request.user?.display_name || request.user?.username}
                          </p>
                          <p className="text-gray-400 text-sm">Wants to be friends</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request.user_id)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(request.user_id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {friendRequests.sent.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Sent Requests</h3>
                <div className="space-y-3">
                  {friendRequests.sent.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {request.friend?.display_name?.charAt(0) || request.friend?.username?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {request.friend?.display_name || request.friend?.username}
                          </p>
                          <p className="text-gray-400 text-sm">Request pending</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(request.friend_id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {friendRequests.received.length === 0 && friendRequests.sent.length === 0 && (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No friend requests</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="text-gray-400">Searching...</div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.display_name?.charAt(0) || user.username.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.display_name || user.username}</p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
                <p className="text-gray-500 text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendsList
