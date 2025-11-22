import { useState } from 'react'
import { X, Shield, DollarSign } from 'lucide-react'
import type { Lobby } from '../types'

interface JoinConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  lobby: Lobby | null
  isJoining?: boolean
}

const JoinConfirmationModal = ({ isOpen, onClose, onConfirm, lobby, isJoining = false }: JoinConfirmationModalProps) => {
  const [fairPlayCommitments, setFairPlayCommitments] = useState({
    noSmurfing: false,
    connectionQuality: false,
    proofOfResults: false
  })


  if (!isOpen || !lobby) return null

  const pot = lobby.price * lobby.max_players
  const platform_fee = pot * 0.10
  const bond_per_player = (platform_fee * 0.5) / lobby.max_players
  const winner_amount = pot - platform_fee

  const allCommitmentsAccepted = fairPlayCommitments.noSmurfing && 
                                  fairPlayCommitments.connectionQuality && 
                                  fairPlayCommitments.proofOfResults

  const handleConfirm = () => {
    if (allCommitmentsAccepted) {
      onConfirm()
      // Reset on close
      setFairPlayCommitments({
        noSmurfing: false,
        connectionQuality: false,
        proofOfResults: false
      })
    }
  }

  const handleClose = () => {
    setFairPlayCommitments({
      noSmurfing: false,
      connectionQuality: false,
      proofOfResults: false
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Confirm Join
            </h2>
            <p className="text-gray-400 mt-1">
              Review payout breakdown and commitments
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Payout Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Payout Breakdown</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Buy-in (per player)</span>
              <span className="text-white font-medium">${lobby.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Players</span>
              <span className="text-white font-medium">{lobby.max_players}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Total Pot</span>
              <span className="text-white font-medium">${pot.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Platform fee (10%)</span>
              <span className="text-red-400 font-medium">-${platform_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Bond (per player)</span>
              <span className="text-white font-medium">${bond_per_player.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-300 font-semibold">Winner Payout</span>
              <span className="text-green-400 font-bold text-xl">${winner_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Fair Play Commitments */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Fair Play Commitments</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fairPlayCommitments.noSmurfing}
                onChange={(e) => setFairPlayCommitments(prev => ({ ...prev, noSmurfing: e.target.checked }))}
                className="w-4 h-4 text-blue-600 mt-1"
              />
              <div>
                <div className="text-white font-medium">No Smurfing or Account Boosting</div>
                <div className="text-sm text-gray-400">I will play on my main account with accurate rank/MMR.</div>
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
                <div className="text-white font-medium">Acceptable Connection Quality</div>
                <div className="text-sm text-gray-400">I have stable connection with &lt;100ms ping to selected region.</div>
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
                <div className="text-white font-medium">Proof of Match Results</div>
                <div className="text-sm text-gray-400">I will provide screenshots/video if match result is disputed.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allCommitmentsAccepted || isJoining}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Confirm Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default JoinConfirmationModal

