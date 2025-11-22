import { useState, useEffect } from 'react'
import { ArrowRight, MapPin, Plus, Search, X, MessageCircle } from 'lucide-react'
import type { Lobby } from '../types'
import { LobbyService } from '../lib/services/lobbyService'
import CreateLobbyModal from './CreateLobbyModal'
import LobbyDetailsModal from './LobbyDetailsModal'
import LobbyChat from './LobbyChat'
import LoginModal from './LoginModal'
import JoinConfirmationModal from './JoinConfirmationModal'
import { supabase } from '../lib/supabase'

const FeaturedLobbies = () => {
  const [selectedGame] = useState('All Games')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [searchTerm, setSearchTerm] = useState('')
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatLobbyId, setChatLobbyId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showMyLobbies, setShowMyLobbies] = useState(false)
  const [myParticipatingLobbies, setMyParticipatingLobbies] = useState<Set<string>>(new Set())
  
  // New filter states
  const [sortBy, setSortBy] = useState('newest')
  const [status, setStatus] = useState('All Statuses')
  const [platform, setPlatform] = useState('All Platforms')
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [showFilters, setShowFilters] = useState(false)

  const regions = ['All Regions', 'SEA', 'NA', 'EU', 'Asia']
  const statusOptions = ['All Statuses', 'waiting', 'in_progress', 'completed', 'cancelled']
  const platformOptions = ['All Platforms', 'PC', 'Console', 'Mobile']

  // Filter functions
  const applyFilters = (lobbies: Lobby[]): Lobby[] => {
    return lobbies.filter(lobby => {
      // Status filter
      if (status !== 'All Statuses' && lobby.status !== status) {
        return false
      }
      
      // Platform filter (for now, we'll assume all are PC since we don't have platform data)
      // This can be extended when platform data is added to the database
      if (platform !== 'All Platforms') {
        // For now, skip platform filtering since we don't have platform data
        // return false
      }
      
      // Price range filter
      if (lobby.price < priceRange[0] || lobby.price > priceRange[1]) {
        return false
      }
      
      return true
    })
  }

  // Sort function
  const applySorting = (lobbies: Lobby[]): Lobby[] => {
    return [...lobbies].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        default:
          return 0
      }
    })
  }

  // Check authentication status and load user's participating lobbies
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Load lobbies where user is a participant
        if (user) {
          const { data: participants, error } = await supabase
            .from('lobby_participants')
            .select('lobby_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
          
          if (!error && participants) {
            setMyParticipatingLobbies(new Set(participants.map(p => p.lobby_id)))
          }
        } else {
          setMyParticipatingLobbies(new Set())
        }
      } catch (err) {
        console.error('Error checking auth:', err)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      // Reload participating lobbies when auth changes
      if (session?.user) {
        const { data: participants, error } = await supabase
          .from('lobby_participants')
          .select('lobby_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
        
        if (!error && participants) {
          setMyParticipatingLobbies(new Set(participants.map(p => p.lobby_id)))
        }
      } else {
        setMyParticipatingLobbies(new Set())
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load lobbies from Supabase
  useEffect(() => {
    const loadLobbies = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading lobbies with filters...', {
          searchTerm,
          selectedGame,
          selectedRegion,
          status,
          platform,
          priceRange,
          sortBy
        })
        
        let lobbiesData: Lobby[] = []
        
        // If there's a search term, use search function
        if (searchTerm.trim()) {
          const { data, error } = await supabase.rpc('search_lobbies', {
            search_term: searchTerm.trim()
          })
          
          if (error) {
            console.error('Search error:', error)
            throw error
          }
          
          lobbiesData = data || []
        } else {
          // Use existing filter logic
          if (selectedGame === 'All Games' && selectedRegion === 'All Regions') {
            lobbiesData = await LobbyService.getLobbies()
          } else if (selectedGame === 'All Games') {
            lobbiesData = await LobbyService.getLobbiesByRegion(selectedRegion)
          } else if (selectedRegion === 'All Regions') {
            lobbiesData = await LobbyService.getLobbiesByGame(selectedGame)
          } else {
            lobbiesData = await LobbyService.getLobbiesByGameAndRegion(selectedGame, selectedRegion)
          }
        }
        
        // Filter out completed lobbies from public view
        lobbiesData = lobbiesData.filter(lobby => lobby.status !== 'completed')
        
        // Apply "My Lobbies" filter if active
        if (showMyLobbies && user) {
          lobbiesData = lobbiesData.filter(lobby => {
            // Show lobbies created by user or where user is a participant
            return lobby.created_by === user.id || myParticipatingLobbies.has(lobby.id)
          })
        }
        
        // Apply additional filters
        lobbiesData = applyFilters(lobbiesData)
        
        // Apply sorting
        lobbiesData = applySorting(lobbiesData)
        
        console.log('Filtered and sorted lobbies:', lobbiesData)
        setLobbies(lobbiesData)
      } catch (err) {
        console.error('Error loading lobbies:', err)
        setError('Failed to load lobbies. Please try again.')
        // Set empty array as fallback
        setLobbies([])
      } finally {
        setLoading(false)
      }
    }

    loadLobbies()
  }, [selectedGame, selectedRegion, searchTerm, status, platform, priceRange, sortBy, showMyLobbies, user, myParticipatingLobbies])

  // Real-time updates for lobbies
  useEffect(() => {
    const channel = supabase
      .channel('lobbies-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lobbies' 
        }, 
        async (payload) => {
          console.log('🔄 Lobby change detected:', payload)
          
          // Reload lobbies when any lobby changes
          try {
            let updatedLobbies: Lobby[] = []
            
            if (searchTerm.trim()) {
              const { data, error } = await supabase.rpc('search_lobbies', {
                search_term: searchTerm.trim()
              })
              if (!error) updatedLobbies = data || []
            } else {
              if (selectedGame === 'All Games' && selectedRegion === 'All Regions') {
                updatedLobbies = await LobbyService.getLobbies()
              } else if (selectedGame === 'All Games') {
                updatedLobbies = await LobbyService.getLobbiesByRegion(selectedRegion)
              } else if (selectedRegion === 'All Regions') {
                updatedLobbies = await LobbyService.getLobbiesByGame(selectedGame)
              } else {
                updatedLobbies = await LobbyService.getLobbiesByGameAndRegion(selectedGame, selectedRegion)
              }
            }
            
            // Filter out completed lobbies from public view
            updatedLobbies = updatedLobbies.filter(lobby => lobby.status !== 'completed')
            
            // Apply "My Lobbies" filter if active
            if (showMyLobbies && user) {
              updatedLobbies = updatedLobbies.filter(lobby => {
                return lobby.created_by === user.id || myParticipatingLobbies.has(lobby.id)
              })
            }
            
            // Apply filters and sorting
            updatedLobbies = applyFilters(updatedLobbies)
            updatedLobbies = applySorting(updatedLobbies)
            
            setLobbies(updatedLobbies)
            console.log('✅ Lobbies updated in real-time')
          } catch (err) {
            console.error('❌ Error updating lobbies:', err)
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lobby_participants' 
        }, 
        async (payload) => {
          console.log('🔄 Lobby participants change detected:', payload)
          
          // Reload lobbies when participants change
          try {
            let updatedLobbies: Lobby[] = []
            
            if (searchTerm.trim()) {
              const { data, error } = await supabase.rpc('search_lobbies', {
                search_term: searchTerm.trim()
              })
              if (!error) updatedLobbies = data || []
            } else {
              if (selectedGame === 'All Games' && selectedRegion === 'All Regions') {
                updatedLobbies = await LobbyService.getLobbies()
              } else if (selectedGame === 'All Games') {
                updatedLobbies = await LobbyService.getLobbiesByRegion(selectedRegion)
              } else if (selectedRegion === 'All Regions') {
                updatedLobbies = await LobbyService.getLobbiesByGame(selectedGame)
              } else {
                updatedLobbies = await LobbyService.getLobbiesByGameAndRegion(selectedGame, selectedRegion)
              }
            }
            
            // Filter out completed lobbies from public view
            updatedLobbies = updatedLobbies.filter(lobby => lobby.status !== 'completed')
            
            // Reload participating lobbies when participants change
            if (user) {
              const { data: participants } = await supabase
                .from('lobby_participants')
                .select('lobby_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
              
              if (participants) {
                setMyParticipatingLobbies(new Set(participants.map(p => p.lobby_id)))
              }
            }
            
            // Apply "My Lobbies" filter if active
            if (showMyLobbies && user) {
              updatedLobbies = updatedLobbies.filter(lobby => {
                return lobby.created_by === user.id || myParticipatingLobbies.has(lobby.id)
              })
            }
            
            // Apply filters and sorting
            updatedLobbies = applyFilters(updatedLobbies)
            updatedLobbies = applySorting(updatedLobbies)
            
            setLobbies(updatedLobbies)
            console.log('✅ Lobbies updated due to participant changes')
          } catch (err) {
            console.error('❌ Error updating lobbies due to participant changes:', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedGame, selectedRegion, searchTerm, status, platform, priceRange, sortBy, showMyLobbies, user, myParticipatingLobbies])

  const handleJoinLobby = async () => {
    if (!selectedLobbyId) return
    
    try {
      setIsJoining(true)
      await LobbyService.joinLobby(selectedLobbyId)
      
      // Reload lobbies to update player counts
      let updatedLobbies = await LobbyService.getLobbies()
      
      // Filter out completed lobbies from public view
      updatedLobbies = updatedLobbies.filter(lobby => lobby.status !== 'completed')
      
      // Apply filters and sorting
      updatedLobbies = applyFilters(updatedLobbies)
      updatedLobbies = applySorting(updatedLobbies)
      
      setLobbies(updatedLobbies)
      setShowJoinConfirmation(false)
      setSelectedLobbyId(null)
    } catch (err) {
      console.error('Error joining lobby:', err)
      alert('Failed to join lobby. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLobbyCreated = async () => {
    // Reload lobbies after creating a new one
    try {
      console.log('🔄 Refreshing lobbies after creation...')
      let updatedLobbies = await LobbyService.getLobbies()
      
      // Apply filters and sorting
      updatedLobbies = applyFilters(updatedLobbies)
      updatedLobbies = applySorting(updatedLobbies)
      
      console.log('✅ Updated lobbies:', updatedLobbies)
      setLobbies(updatedLobbies)
    } catch (err) {
      console.error('❌ Error reloading lobbies:', err)
    }
  }

  const handleViewDetails = (lobbyId: string) => {
    setSelectedLobbyId(lobbyId)
    setShowDetailsModal(true)
  }

  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    setSelectedLobbyId(null)
  }

  const handleLobbyJoined = async () => {
    // Refresh lobbies after joining from details modal
    try {
      console.log('🔄 Refreshing lobbies after join from details modal...')
      
      // Reload participating lobbies
      if (user) {
        const { data: participants } = await supabase
          .from('lobby_participants')
          .select('lobby_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
        
        if (participants) {
          setMyParticipatingLobbies(new Set(participants.map(p => p.lobby_id)))
        }
      }
      
      let updatedLobbies = await LobbyService.getLobbies()
      
      // Filter out completed lobbies from public view
      updatedLobbies = updatedLobbies.filter(lobby => lobby.status !== 'completed')
      
      // Apply "My Lobbies" filter if active
      if (showMyLobbies && user) {
        updatedLobbies = updatedLobbies.filter(lobby => {
          return lobby.created_by === user.id || myParticipatingLobbies.has(lobby.id)
        })
      }
      
      // Apply filters and sorting
      updatedLobbies = applyFilters(updatedLobbies)
      updatedLobbies = applySorting(updatedLobbies)
      
      setLobbies(updatedLobbies)
      console.log('✅ Lobbies refreshed after join')
    } catch (err) {
      console.error('❌ Error refreshing lobbies after join:', err)
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In-Progress'
      case 'waiting':
        return 'Waiting'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  return (
    <section id="lobbies" className="bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 sm:mb-0">
            {showMyLobbies && user ? 'My Lobbies' : 'Featured Lobbies'}
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            {/* My Lobbies Toggle */}
            {user && (
              <button
                onClick={() => setShowMyLobbies(!showMyLobbies)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  showMyLobbies
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {showMyLobbies ? 'All Lobbies' : 'My Lobbies'}
              </button>
            )}
            {user ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <Plus size={16} />
                Create Lobby
              </button>
            ) : (
              <button
                onClick={() => alert('Please sign up and log in to create lobbies!')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 cursor-not-allowed opacity-75"
                disabled
              >
                <Plus size={16} />
                Create Lobby (Login Required)
              </button>
            )}
            {!user && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-white hover:text-gray-300 flex items-center gap-2 transition-colors"
              >
                See all lobbies
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by game or rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'All Statuses' ? 'All Statuses' : 
                         option === 'waiting' ? 'Waiting' :
                         option === 'in_progress' ? 'In Progress' :
                         option === 'completed' ? 'Completed' : 'Cancelled'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region === 'All Regions' ? 'All Regions' : region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platformOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buy-in Range */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3 text-center">Buy-in Range</label>
                  <div className="space-y-4">
                    {/* Range Slider */}
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #6A6AFF 0%, #6A6AFF ${(priceRange[1] / 10000) * 100}%, #374151 ${(priceRange[1] / 10000) * 100}%, #374151 100%)`
                        }}
                      />
                      
                      {/* Range Labels */}
                      <div className="flex justify-between mt-3 text-sm text-white">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Lobby Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lobbies.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">No lobbies found</div>
                <p className="text-gray-500">Try adjusting your filters or create a new lobby</p>
              </div>
            ) : (
              lobbies.map((lobby) => (
            <div key={lobby.id} className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">
              {/* Custom Title & Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-sm">🎮</span>
                    </div>
                    <span className="text-white font-semibold">{lobby.game}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 truncate">
                    {(lobby as any).custom_title || `${lobby.game} - $${lobby.price} - ${lobby.region}`}
                  </h3>
                  {(lobby as any).description && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {(lobby as any).description}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ml-2 ${
                  lobby.status === 'in_progress' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : lobby.status === 'waiting'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : lobby.status === 'completed'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {getStatusDisplay(lobby.status)}
                </span>
              </div>

              {/* Price & Region */}
              <div className="mb-4">
                <div className="text-3xl font-bold text-white mb-2">
                  ${lobby.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin size={16} className="text-blue-400" />
                  <span>{lobby.region}</span>
                </div>
              </div>

              {/* Player Count */}
              <div className="mb-3">
                <div className="text-sm text-gray-400">
                  Players: {lobby.current_players}/{lobby.max_players}
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center py-1 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">Pot</span>
                  <span className="text-white font-medium">${lobby.pot.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">Platform fee</span>
                  <span className="text-white font-medium">${lobby.platform_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">Bond/plyr</span>
                  <span className="text-white font-medium">${lobby.bond_per_player.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300 font-medium">Winner</span>
                  <span className="text-green-400 font-bold text-lg">${lobby.winner_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDetails(lobby.id)}
                  className="flex-1 group border-2 border-gray-600 text-gray-300 hover:border-white hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                >
                  <span className="group-hover:translate-x-1 transition-transform inline-block">View Details</span>
                </button>
                <button 
                  onClick={() => {
                    setChatLobbyId(lobby.id)
                    setShowChat(true)
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1"
                  title="Open Chat"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedLobbyId(lobby.id)
                    setShowJoinConfirmation(true)
                  }}
                  disabled={lobby.status !== 'waiting' || lobby.current_players >= lobby.max_players}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                >
                  {lobby.status === 'waiting' && lobby.current_players < lobby.max_players 
                    ? 'Quick Join' 
                    : lobby.status === 'in_progress' 
                    ? 'In Progress' 
                    : 'Full'}
                </button>
              </div>
            </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Lobby Modal - Only show if user is authenticated */}
      {user && (
        <CreateLobbyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onLobbyCreated={handleLobbyCreated}
        />
      )}

      {/* Lobby Details Modal */}
      <LobbyDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        lobbyId={selectedLobbyId}
        onLobbyJoined={handleLobbyJoined}
      />

      {/* Chat Modal */}
      {showChat && chatLobbyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Lobby Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <LobbyChat 
              lobbyId={chatLobbyId} 
              isOpen={true}
              onToggle={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setShowLoginModal(false)
          // You can add signup modal state here if needed
        }}
      />

      {/* Join Confirmation Modal */}
      <JoinConfirmationModal
        isOpen={showJoinConfirmation}
        onClose={() => {
          setShowJoinConfirmation(false)
          setSelectedLobbyId(null)
        }}
        onConfirm={handleJoinLobby}
        lobby={lobbies.find(l => l.id === selectedLobbyId) || null}
        isJoining={isJoining}
      />
    </section>
  )
}

export default FeaturedLobbies
