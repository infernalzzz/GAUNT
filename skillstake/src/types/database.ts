export interface User {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
  is_verified: boolean
}

export interface Lobby {
  id: string
  game: string
  price: number
  region: string
  pot: number
  platform_fee: number
  bond_per_player: number
  winner_amount: number
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  created_by: string
  max_players: number
  current_players: number
}

export interface LobbyParticipant {
  id: string
  lobby_id: string
  user_id: string
  joined_at: string
  status: 'active' | 'left' | 'disqualified'
}

export interface Game {
  id: string
  name: string
  icon: string
  is_active: boolean
  created_at: string
}

export interface Region {
  id: string
  name: string
  code: string
  is_active: boolean
}
