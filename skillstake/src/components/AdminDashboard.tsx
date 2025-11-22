import { useState, useEffect } from 'react'
import { Trash2, Users, Archive, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'
import LobbyReviewModal from './LobbyReviewModal'

interface Lobby {
  id: string
  game: string
  custom_title?: string
  price: number
  region: string
  status: string
  current_players: number
  max_players: number
  created_at: string
  updated_at?: string
  created_by?: string
  host_username?: string
  game_id?: string
}


const AdminDashboard = () => {
  const { isAdmin, adminUser, loading } = useAdmin()
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [pendingReviewLobbies, setPendingReviewLobbies] = useState<Lobby[]>([])
  const [completedLobbies, setCompletedLobbies] = useState<Lobby[]>([])
  const [activeTab, setActiveTab] = useState<'lobbies' | 'pending_review' | 'completed'>('lobbies')
  const [loadingData, setLoadingData] = useState(true)
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Load all lobbies with host information
      const { data: allLobbies, error: lobbiesError } = await supabase
        .from('lobbies')
        .select(`
          *,
          host:users!lobbies_created_by_fkey(username)
        `)
        .order('created_at', { ascending: false })

      if (lobbiesError) {
        console.error('Error loading lobbies:', lobbiesError)
      } else {
        const allLobbiesData = allLobbies || []
        // Active lobbies: all except completed and pending_admin_review
        setLobbies(allLobbiesData.filter(l => l.status !== 'completed' && l.status !== 'pending_admin_review'))
        // Pending review lobbies
        setPendingReviewLobbies(allLobbiesData.filter(l => l.status === 'pending_admin_review'))
        // Completed lobbies
        setCompletedLobbies(allLobbiesData.filter(l => l.status === 'completed'))
      }
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const deleteLobby = async (lobbyId: string) => {
    if (!confirm('Are you sure you want to delete this lobby? This action cannot be undone.')) {
      return
    }

    try {
      // Log admin action (don't fail if this errors)
      try {
        await supabase.rpc('log_admin_action', {
          action_type: 'delete_lobby',
          target_id: lobbyId,
          target_type: 'lobby',
          reason: 'Admin deletion'
        })
      } catch (logError) {
        console.warn('Failed to log admin action:', logError)
        // Continue with deletion even if logging fails
      }

      // Delete lobby (this will cascade to participants due to foreign key)
      // Check both error and data to verify deletion succeeded
      const { data, error } = await supabase
        .from('lobbies')
        .delete()
        .eq('id', lobbyId)
        .select()

      if (error) {
        console.error('Error deleting lobby:', error)
        alert(`Failed to delete lobby: ${error.message}`)
        return
      }

      // Check if any rows were actually deleted
      // When RLS blocks deletion, data will be empty/null
      if (!data || data.length === 0) {
        console.error('Lobby deletion was blocked - no rows deleted')
        alert('Failed to delete lobby: Access denied. Please check RLS policies allow admins to delete lobbies.')
        return
      }

      alert('Lobby deleted successfully')
      loadData() // Reload data
    } catch (err) {
      console.error('Error deleting lobby:', err)
      alert(`Failed to delete lobby: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading admin panel...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {adminUser?.username}</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('lobbies')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'lobbies'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Active Lobbies ({lobbies.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_review')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pending_review'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Review Games ({pendingReviewLobbies.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Archive className="w-4 h-4 inline mr-2" />
            Completed Lobbies ({completedLobbies.length})
          </button>
        </div>

        {/* Content */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-white">Loading...</div>
          </div>
        ) : (
          <>
            {/* Active Lobbies Tab */}
            {activeTab === 'lobbies' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Active Lobbies</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-gray-300">Game</th>
                        <th className="pb-3 text-gray-300">Title</th>
                        <th className="pb-3 text-gray-300">Price</th>
                        <th className="pb-3 text-gray-300">Players</th>
                        <th className="pb-3 text-gray-300">Status</th>
                        <th className="pb-3 text-gray-300">Host</th>
                        <th className="pb-3 text-gray-300">Created</th>
                        <th className="pb-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lobbies.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            No active lobbies
                          </td>
                        </tr>
                      ) : (
                        lobbies.map((lobby) => (
                          <tr 
                            key={lobby.id} 
                            className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedLobbyId(lobby.id)
                              setIsReviewModalOpen(true)
                            }}
                          >
                            <td className="py-3 text-white">{lobby.game}</td>
                            <td className="py-3 text-white">
                              {lobby.custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                            </td>
                            <td className="py-3 text-white">${lobby.price}</td>
                            <td className="py-3 text-white">{lobby.current_players}/{lobby.max_players}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                lobby.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                                lobby.status === 'in_progress' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {lobby.status === 'waiting' ? 'Waiting' :
                                 lobby.status === 'in_progress' ? 'In Progress' :
                                 lobby.status}
                              </span>
                            </td>
                            <td className="py-3 text-white">{(lobby as any).host?.username || 'Unknown'}</td>
                            <td className="py-3 text-gray-400">
                              {new Date(lobby.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLobbyId(lobby.id)
                                    setIsReviewModalOpen(true)
                                  }}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Review Lobby"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteLobby(lobby.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete Lobby"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Review Tab */}
            {activeTab === 'pending_review' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Review Games</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-gray-300">Game</th>
                        <th className="pb-3 text-gray-300">Title</th>
                        <th className="pb-3 text-gray-300">Price</th>
                        <th className="pb-3 text-gray-300">Players</th>
                        <th className="pb-3 text-gray-300">Game ID</th>
                        <th className="pb-3 text-gray-300">Host</th>
                        <th className="pb-3 text-gray-300">Submitted</th>
                        <th className="pb-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReviewLobbies.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            No lobbies pending review
                          </td>
                        </tr>
                      ) : (
                        pendingReviewLobbies.map((lobby) => (
                          <tr 
                            key={lobby.id} 
                            className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedLobbyId(lobby.id)
                              setIsReviewModalOpen(true)
                            }}
                          >
                            <td className="py-3 text-white">{lobby.game}</td>
                            <td className="py-3 text-white">
                              {lobby.custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                            </td>
                            <td className="py-3 text-white">${lobby.price}</td>
                            <td className="py-3 text-white">{lobby.current_players}/{lobby.max_players}</td>
                            <td className="py-3 text-white">
                              {(lobby as any).game_id || '-'}
                            </td>
                            <td className="py-3 text-white">{(lobby as any).host?.username || 'Unknown'}</td>
                            <td className="py-3 text-gray-400">
                              {lobby.updated_at ? new Date(lobby.updated_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedLobbyId(lobby.id)
                                  setIsReviewModalOpen(true)
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Review Lobby"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Completed Lobbies Tab */}
            {activeTab === 'completed' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Completed Lobbies</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-gray-300">Game</th>
                        <th className="pb-3 text-gray-300">Title</th>
                        <th className="pb-3 text-gray-300">Price</th>
                        <th className="pb-3 text-gray-300">Players</th>
                        <th className="pb-3 text-gray-300">Host</th>
                        <th className="pb-3 text-gray-300">Created</th>
                        <th className="pb-3 text-gray-300">Completed</th>
                        <th className="pb-3 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedLobbies.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            No completed lobbies yet
                          </td>
                        </tr>
                      ) : (
                        completedLobbies.map((lobby) => (
                          <tr 
                            key={lobby.id} 
                            className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedLobbyId(lobby.id)
                              setIsReviewModalOpen(true)
                            }}
                          >
                            <td className="py-3 text-white">{lobby.game}</td>
                            <td className="py-3 text-white">
                              {lobby.custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                            </td>
                            <td className="py-3 text-white">${lobby.price}</td>
                            <td className="py-3 text-white">{lobby.current_players}/{lobby.max_players}</td>
                            <td className="py-3 text-white">{(lobby as any).host?.username || 'Unknown'}</td>
                            <td className="py-3 text-gray-400">
                              {new Date(lobby.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-gray-400">
                              {lobby.updated_at ? new Date(lobby.updated_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedLobbyId(lobby.id)
                                  setIsReviewModalOpen(true)
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="View Lobby"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lobby Review Modal */}
      <LobbyReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setSelectedLobbyId(null)
        }}
        lobbyId={selectedLobbyId}
        onComplete={() => {
          loadData() // Reload lobbies after completion
        }}
      />
    </div>
  )
}

export default AdminDashboard
