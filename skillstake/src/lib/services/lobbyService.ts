import { supabase } from '../supabase'
import type { Lobby, CreateLobbyData } from '../../types'

export class LobbyService {
  // Get all lobbies
  static async getLobbies(): Promise<Lobby[]> {
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching lobbies:', error)
        // Return mock data if Supabase is not configured
        return this.getMockLobbies()
      }

      return data || []
    } catch (err) {
      console.error('Supabase connection error:', err)
      // Return mock data if Supabase is not configured
      return this.getMockLobbies()
    }
  }

  // Mock data for when Supabase is not configured
  static getMockLobbies(): Lobby[] {
    return [
      {
        id: '1',
        game: 'Valorant',
        price: 5.00,
        region: 'SEA',
        pot: 10.00,
        platform_fee: 1.00,
        bond_per_player: 0.25,
        winner_amount: 9.00,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_players: 2,
        current_players: 2,
        custom_title: 'Epic 1v1 Showdown',
        description: 'High-stakes Valorant duel! Best of 3 rounds, first to 13 wins.'
      },
      {
        id: '2',
        game: 'Valorant',
        price: 20.00,
        region: 'SEA',
        pot: 40.00,
        platform_fee: 4.00,
        bond_per_player: 1.00,
        winner_amount: 36.00,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_players: 2,
        current_players: 2,
        custom_title: 'Ranked Grind Session',
        description: 'Serious players only. Ranked match with strict rules.'
      },
      {
        id: '3',
        game: 'CS2',
        price: 25.00,
        region: 'SEA',
        pot: 50.00,
        platform_fee: 5.00,
        bond_per_player: 1.25,
        winner_amount: 45.00,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_players: 2,
        current_players: 1,
        custom_title: 'CS2 Aim Battle',
        description: 'Aim map 1v1, first to 16 rounds wins. No camping allowed!'
      },
      {
        id: '4',
        game: 'Valorant',
        price: 5.00,
        region: 'SEA',
        pot: 10.00,
        platform_fee: 1.00,
        bond_per_player: 0.25,
        winner_amount: 9.00,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_players: 2,
        current_players: 0
      }
    ]
  }

  // Get lobbies by game
  static async getLobbiesByGame(game: string): Promise<Lobby[]> {
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .select('*')
        .eq('game', game)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching lobbies by game:', error)
        return this.getMockLobbies().filter(lobby => lobby.game === game)
      }

      return data || []
    } catch (err) {
      console.error('Supabase connection error:', err)
      return this.getMockLobbies().filter(lobby => lobby.game === game)
    }
  }

  // Get lobbies by region
  static async getLobbiesByRegion(region: string): Promise<Lobby[]> {
    const { data, error } = await supabase
      .from('lobbies')
      .select('*')
      .eq('region', region)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lobbies by region:', error)
      throw error
    }

    return data || []
  }

  // Get lobbies by game and region
  static async getLobbiesByGameAndRegion(game: string, region: string): Promise<Lobby[]> {
    const { data, error } = await supabase
      .from('lobbies')
      .select('*')
      .eq('game', game)
      .eq('region', region)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lobbies by game and region:', error)
      throw error
    }

    return data || []
  }

  // Create a new lobby
  static async createLobby(lobbyData: CreateLobbyData): Promise<Lobby> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to create a lobby')
      }

    // Calculate financial details
    const pot = lobbyData.price * (lobbyData.max_players || 2)
    const platform_fee = pot * 0.10 // 10% platform fee
    const bond_per_player = (platform_fee * 0.5) / (lobbyData.max_players || 2) // 50% of platform fee divided by players
    const winner_amount = pot - platform_fee

    const { data, error } = await supabase
      .from('lobbies')
      .insert({
        game: lobbyData.game,
        price: lobbyData.price,
        region: lobbyData.region,
        pot,
        platform_fee,
        bond_per_player,
        winner_amount,
        created_by: user.id,
        max_players: lobbyData.max_players || 2,
        current_players: 1, // Creator automatically joins
        status: 'waiting',
        custom_title: lobbyData.custom_title || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lobby:', error)
      throw error
    }

    // Automatically add the creator as a participant
    const { error: participantError } = await supabase
      .from('lobby_participants')
      .insert({
        lobby_id: data.id,
        user_id: user.id,
        status: 'active'
      })

    if (participantError) {
      console.error('Error adding creator as participant:', participantError)
      // Don't throw error here as lobby was created successfully
      // The creator can still manually join if needed
    }

    return data
    } catch (err) {
      console.error('Supabase connection error:', err)
      throw new Error('Failed to create lobby. Please check your connection.')
    }
  }

  // Join a lobby
  static async joinLobby(lobbyId: string): Promise<void> {
    try {
      console.log('🚀 Starting joinLobby process for:', lobbyId)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be authenticated to join a lobby')
      }
      
      console.log('👤 User authenticated:', user.id)

    // Check if lobby exists and has space
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single()

    if (lobbyError || !lobby) {
      throw new Error('Lobby not found')
    }

    if (lobby.current_players >= lobby.max_players) {
      throw new Error('Lobby is full')
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Lobby is not accepting new players')
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('lobby_participants')
      .select('id')
      .eq('lobby_id', lobbyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingParticipant) {
      console.log('⚠️ User is already a participant in this lobby')
      throw new Error('You are already a participant in this lobby')
    }

    // Add participant
    console.log('👥 Adding participant to lobby...')
    const { error: participantError } = await supabase
      .from('lobby_participants')
      .insert({
        lobby_id: lobbyId,
        user_id: user.id,
        status: 'active'
      })

    if (participantError) {
      console.error('❌ Error joining lobby:', participantError)
      if (participantError.code === '23505') { // Unique constraint violation
        throw new Error('You are already a participant in this lobby')
      }
      throw new Error(`Failed to join lobby: ${participantError.message}`)
    }
    
    console.log('✅ Participant added successfully')

    // Update lobby player count
    const newPlayerCount = lobby.current_players + 1
    const newStatus = newPlayerCount >= lobby.max_players ? 'in_progress' : 'waiting'
    
    console.log(`🔄 Updating lobby ${lobbyId}: players ${lobby.current_players} -> ${newPlayerCount}, status: ${lobby.status} -> ${newStatus}`)
    
    const { error: updateError } = await supabase
      .from('lobbies')
      .update({ 
        current_players: newPlayerCount,
        status: newStatus
      })
      .eq('id', lobbyId)

    if (updateError) {
      console.error('❌ Error updating lobby:', updateError)
      console.error('❌ Update details:', {
        lobbyId,
        newPlayerCount,
        newStatus,
        currentPlayers: lobby.current_players,
        maxPlayers: lobby.max_players
      })
      throw new Error(`Failed to update lobby: ${updateError.message}`)
    } else {
      console.log('✅ Lobby updated successfully')
    }
    
    console.log('🎉 JoinLobby completed successfully')
    
    } catch (error) {
      console.error('💥 JoinLobby failed:', error)
      throw error
    }
  }

  // Leave a lobby
  static async leaveLobby(lobbyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to leave a lobby')
    }

    // Remove participant
    const { error: participantError } = await supabase
      .from('lobby_participants')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('user_id', user.id)

    if (participantError) {
      console.error('Error leaving lobby:', participantError)
      throw participantError
    }

    // Update lobby player count
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('current_players')
      .eq('id', lobbyId)
      .single()

    if (lobbyError) {
      console.error('Error fetching lobby:', lobbyError)
      throw lobbyError
    }

    const { error: updateError } = await supabase
      .from('lobbies')
      .update({ 
        current_players: Math.max(0, lobby.current_players - 1),
        status: lobby.current_players - 1 <= 0 ? 'waiting' : 'in_progress'
      })
      .eq('id', lobbyId)

    if (updateError) {
      console.error('Error updating lobby:', updateError)
      throw updateError
    }
  }

  // Update lobby status
  static async updateLobbyStatus(lobbyId: string, status: Lobby['status']): Promise<void> {
    const { error } = await supabase
      .from('lobbies')
      .update({ status })
      .eq('id', lobbyId)

    if (error) {
      console.error('Error updating lobby status:', error)
      throw error
    }
  }

  // Delete a lobby
  static async deleteLobby(lobbyId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to delete a lobby')
    }

    // Check if user created the lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('created_by')
      .eq('id', lobbyId)
      .single()

    if (lobbyError || !lobby) {
      throw new Error('Lobby not found')
    }

    if (lobby.created_by !== user.id) {
      throw new Error('Only the lobby creator can delete the lobby')
    }

    const { error } = await supabase
      .from('lobbies')
      .delete()
      .eq('id', lobbyId)

    if (error) {
      console.error('Error deleting lobby:', error)
      throw error
    }
  }
}