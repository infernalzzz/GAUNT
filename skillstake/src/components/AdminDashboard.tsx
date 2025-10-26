import { useState, useEffect } from 'react'
import { Trash2, Users, Gamepad2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'

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
  created_by?: string
  host_username?: string
}

interface GameReview {
  id: string
  game_name: string
  description?: string
  status: string
  submitted_by?: string
  created_at: string
}

const AdminDashboard = () => {
  const { isAdmin, adminUser, loading } = useAdmin()
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [gameReviews, setGameReviews] = useState<GameReview[]>([])
  const [activeTab, setActiveTab] = useState<'lobbies' | 'games'>('lobbies')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Load lobbies with host information
      const { data: lobbiesData, error: lobbiesError } = await supabase
        .from('lobbies')
        .select(`
          *,
          host:users!lobbies_created_by_fkey(username)
        `)
        .order('created_at', { ascending: false })

      if (lobbiesError) {
        console.error('Error loading lobbies:', lobbiesError)
      } else {
        setLobbies(lobbiesData || [])
      }

      // Load game reviews
      const { data: gamesData, error: gamesError } = await supabase
        .from('games_review')
        .select('*')
        .order('created_at', { ascending: false })

      if (gamesError) {
        console.error('Error loading game reviews:', gamesError)
      } else {
        setGameReviews(gamesData || [])
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
      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'delete_lobby',
        target_id: lobbyId,
        target_type: 'lobby',
        reason: 'Admin deletion'
      })

      // Delete lobby (this will cascade to participants due to foreign key)
      const { error } = await supabase
        .from('lobbies')
        .delete()
        .eq('id', lobbyId)

      if (error) {
        console.error('Error deleting lobby:', error)
        alert('Failed to delete lobby')
      } else {
        alert('Lobby deleted successfully')
        loadData() // Reload data
      }
    } catch (err) {
      console.error('Error deleting lobby:', err)
      alert('Failed to delete lobby')
    }
  }

  const approveGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games_review')
        .update({ 
          status: 'approved',
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (error) {
        console.error('Error approving game:', error)
        alert('Failed to approve game')
      } else {
        alert('Game approved successfully')
        loadData() // Reload data
      }
    } catch (err) {
      console.error('Error approving game:', err)
      alert('Failed to approve game')
    }
  }

  const rejectGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games_review')
        .update({ 
          status: 'rejected',
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (error) {
        console.error('Error rejecting game:', error)
        alert('Failed to reject game')
      } else {
        alert('Game rejected successfully')
        loadData() // Reload data
      }
    } catch (err) {
      console.error('Error rejecting game:', err)
      alert('Failed to reject game')
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
            Lobbies ({lobbies.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'games'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Gamepad2 className="w-4 h-4 inline mr-2" />
            Game Reviews ({gameReviews.length})
          </button>
        </div>

        {/* Content */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-white">Loading...</div>
          </div>
        ) : (
          <>
            {/* Lobbies Tab */}
            {activeTab === 'lobbies' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">All Lobbies</h2>
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
                      {lobbies.map((lobby) => (
                        <tr key={lobby.id} className="border-b border-gray-700">
                          <td className="py-3 text-white">{lobby.game}</td>
                          <td className="py-3 text-white">
                            {lobby.custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                          </td>
                          <td className="py-3 text-white">${lobby.price}</td>
                          <td className="py-3 text-white">{lobby.current_players}/{lobby.max_players}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              lobby.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                              lobby.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                              lobby.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {lobby.status}
                            </span>
                          </td>
                          <td className="py-3 text-white">{(lobby as any).host?.username || 'Unknown'}</td>
                          <td className="py-3 text-gray-400">
                            {new Date(lobby.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => deleteLobby(lobby.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete Lobby"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Game Reviews</h2>
                <div className="space-y-4">
                  {gameReviews.map((game) => (
                    <div key={game.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{game.game_name}</h3>
                          {game.description && (
                            <p className="text-gray-400 mt-1">{game.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>Submitted: {new Date(game.created_at).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              game.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              game.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {game.status}
                            </span>
                          </div>
                        </div>
                        {game.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveGame(game.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Approve Game"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => rejectGame(game.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Reject Game"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
