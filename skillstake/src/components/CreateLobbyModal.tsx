import { useState } from 'react'
import { X, Info, Shield } from 'lucide-react'
import type { CreateLobbyData } from '../types'
import { LobbyService } from '../lib/services/lobbyService'

interface CreateLobbyModalProps {
  isOpen: boolean
  onClose: () => void
  onLobbyCreated: () => void
}

const CreateLobbyModal = ({ isOpen, onClose, onLobbyCreated }: CreateLobbyModalProps) => {
  const [formData, setFormData] = useState<CreateLobbyData>({
    game: '',
    price: 0,
    region: '',
    max_players: 2,
    custom_title: ''
  })
  const [matchType, setMatchType] = useState<'immediate' | 'scheduled'>('immediate')
  const [matchRules, setMatchRules] = useState('')
  const [fairPlayCommitments, setFairPlayCommitments] = useState({
    noSmurfing: false,
    connectionQuality: false,
    proofOfResults: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const games = ['Valorant', 'CS2', 'Dota 2', 'League of Legends', 'Overwatch']
  const regions = ['SEA', 'NA', 'EU', 'Asia']
  const platforms = ['PC', 'Console', 'Mobile']

  const quickPresets = [
    { name: 'LoL 1v1 (Howling Abyss)', game: 'League of Legends', rules: '1v1 Howling Abyss, First to 2 kills' },
    { name: 'Dota 2 Mid 1v1', game: 'Dota 2', rules: '1v1 Mid lane, First to 2 kills' },
    { name: 'CS2 Aim 1v1', game: 'CS2', rules: 'Aim map 1v1, First to 16 rounds' },
    { name: 'Valorant Range', game: 'Valorant', rules: 'Range practice, First to 10 kills' },
    { name: 'Overwatch Widow 1v1', game: 'Overwatch', rules: 'Widowmaker 1v1, First to 5 kills' },
    { name: 'TFT Placement', game: 'Teamfight Tactics', rules: 'Placement match, Best of 1' }
  ]

  // Calculate financial details
  const pot = formData.price * (formData.max_players || 2)
  const platform_fee = pot * 0.10 // 10% platform fee
  const bond_per_player = (platform_fee * 0.5) / (formData.max_players || 2) // 50% of platform fee divided by players
  const winner_amount = pot - platform_fee

  const handlePresetClick = (preset: typeof quickPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      game: preset.game,
      price: 5.00
    }))
    setMatchRules(preset.rules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('🚀 Creating lobby with data:', formData)
      const newLobby = await LobbyService.createLobby(formData)
      console.log('✅ Lobby created successfully:', newLobby)
      onLobbyCreated()
      onClose()
      // Reset form
      setFormData({
        game: '',
        price: 0,
        region: '',
        max_players: 2,
        custom_title: ''
      })
      setMatchRules('')
      setFairPlayCommitments({
        noSmurfing: false,
        connectionQuality: false,
        proofOfResults: false
      })
    } catch (err) {
      console.error('❌ Error creating lobby:', err)
      setError(err instanceof Error ? err.message : 'Failed to create lobby')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Create Lobby</h2>
            <p className="text-muted-foreground mt-1">Set up a new match and challenge other players</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Presets */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Game
            </label>
            <select
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" className="bg-gray-800 text-white">Select a game</option>
              {games.map(game => (
                <option key={game} value={game} className="bg-gray-800 text-white">{game}</option>
              ))}
            </select>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Custom Title (Optional)
            </label>
            <input
              type="text"
              value={formData.custom_title}
              onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 'Epic 1v1 Showdown' or 'Ranked Grind Session'"
              maxLength={200}
            />
            <p className="text-sm text-gray-400 mt-1">
              Leave empty to use default title: "{formData.game || 'Game'} - ${formData.price || 0} - {formData.region || 'Region'}"
            </p>
          </div>


          {/* Buy-in Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Buy-in Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          {/* Region and Platform */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Region <Info size={14} className="inline ml-1" />
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" className="bg-gray-800 text-white">Select region</option>
                {regions.map(region => (
                  <option key={region} value={region} className="bg-gray-800 text-white">{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Platform
              </label>
              <select className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="bg-gray-800 text-white">Select platform</option>
                {platforms.map(platform => (
                  <option key={platform} value={platform} className="bg-gray-800 text-white">{platform}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Match Type */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Match Type</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="matchType"
                  value="immediate"
                  checked={matchType === 'immediate'}
                  onChange={(e) => setMatchType(e.target.value as 'immediate')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-foreground">Play Now (immediate check-in)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="matchType"
                  value="scheduled"
                  checked={matchType === 'scheduled'}
                  onChange={(e) => setMatchType(e.target.value as 'scheduled')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-foreground">Scheduled (pick a time within 7 days)</span>
              </label>
            </div>
          </div>

          {/* Match Rules */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Match Rules</h3>
            <textarea
              value={matchRules}
              onChange={(e) => setMatchRules(e.target.value)}
              placeholder="e.g., 1v1 Mid, First to 2 kills"
              className="w-full p-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Payout & Fees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Payout & Fees</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Info size={14} className="mr-1" />
                Fees explainer
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buy-in (per player):</span>
                <span className="text-foreground font-medium">${formData.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Players:</span>
                <span className="text-foreground font-medium">{formData.max_players}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pot:</span>
                <span className="text-foreground font-medium">${pot.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (10%):</span>
                <span className="text-red-400 font-medium">-${platform_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bond (per player):</span>
                <span className="text-foreground font-medium">${bond_per_player.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span className="text-foreground">Winner Payout:</span>
                <span className="text-green-400">${winner_amount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bond = half of platform fee + players. Admin fee on no-show: $100 max (capped by forfeited bond).
            </p>
          </div>

          {/* Fair Play Commitments */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield size={20} className="text-blue-400" />
              Fair Play Commitments
            </h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fairPlayCommitments.noSmurfing}
                  onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, noSmurfing: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <div>
                  <div className="text-foreground font-medium">No Smurfing or Account Boosting</div>
                  <div className="text-sm text-muted-foreground">I will play on my main account with accurate rank/MMR.</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fairPlayCommitments.connectionQuality}
                  onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, connectionQuality: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <div>
                  <div className="text-foreground font-medium">Acceptable Connection Quality</div>
                  <div className="text-sm text-muted-foreground">I have stable connection with &lt;100ms ping to selected region.</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fairPlayCommitments.proofOfResults}
                  onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, proofOfResults: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <div>
                  <div className="text-foreground font-medium">Proof of Match Results</div>
                  <div className="text-sm text-muted-foreground">I will provide screenshots/video if match result is disputed.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fairPlayCommitments.noSmurfing || !fairPlayCommitments.connectionQuality || !fairPlayCommitments.proofOfResults}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Lobby...' : 'Create Lobby'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLobbyModal