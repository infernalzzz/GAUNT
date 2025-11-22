// Lobby types
export interface Lobby {
  id: string
  game: string
  price: number
  region: string
  pot: number
  platform_fee: number
  bond_per_player: number
  winner_amount: number
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'pending_admin_review'
  created_at: string
  updated_at: string
  created_by?: string
  max_players: number
  current_players: number
  custom_title?: string
  description?: string
}

export interface CreateLobbyData {
  game: string
  price: number
  region: string
  max_players?: number
  custom_title?: string
}

