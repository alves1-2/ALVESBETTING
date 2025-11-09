import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { apiCall } from '../utils/api'
import { Trophy, Clock } from 'lucide-react'

interface SportsBettingProps {
  wallet: number
  onBetPlaced: (betAmount: number, won: boolean, winAmount: number) => void
}

interface Match {
  id: string
  sport: string
  team1: string
  team2: string
  odds1: number
  odds2: number
  oddsDraw?: number
  startTime: number
}

export function SportsBetting({ wallet, onBetPlaced }: SportsBettingProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | 'draw' | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const response = await apiCall('/matches')
      setMatches(response.matches)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const placeBet = () => {
    if (!selectedMatch || !selectedTeam || !betAmount) return

    const bet = parseFloat(betAmount)
    if (bet > wallet) return

    // Simulate bet outcome (50% chance of winning for demo)
    const won = Math.random() > 0.5
    let odds = 1.0
    
    if (selectedTeam === 'team1') odds = selectedMatch.odds1
    else if (selectedTeam === 'team2') odds = selectedMatch.odds2
    else if (selectedTeam === 'draw' && selectedMatch.oddsDraw) odds = selectedMatch.oddsDraw

    const winAmount = won ? bet * odds : 0

    onBetPlaced(bet, won, winAmount)
    
    // Reset
    setSelectedMatch(null)
    setSelectedTeam(null)
    setBetAmount('')
  }

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      football: '⚽',
      basketball: '🏀',
      volleyball: '🏐'
    }
    return icons[sport] || '🏆'
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl text-purple-200 mb-2">Sports Betting</h2>
        <p className="text-purple-300">Bet on upcoming matches</p>
      </div>

      <div className="grid gap-4">
        {matches.map(match => (
          <div
            key={match.id}
            className={`bg-purple-900/20 rounded-lg border-2 p-4 transition-all cursor-pointer ${
              selectedMatch?.id === match.id
                ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                : 'border-purple-500/30 hover:border-purple-400'
            }`}
            onClick={() => setSelectedMatch(match)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getSportIcon(match.sport)}</span>
                <span className="text-purple-200 capitalize">{match.sport}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300 text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(match.startTime)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMatch(match)
                  setSelectedTeam('team1')
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMatch?.id === match.id && selectedTeam === 'team1'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                }`}
              >
                <div className="text-white text-sm mb-1">{match.team1}</div>
                <div className="text-green-400">{match.odds1}x</div>
              </button>

              {match.oddsDraw && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedMatch(match)
                    setSelectedTeam('draw')
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMatch?.id === match.id && selectedTeam === 'draw'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                  }`}
                >
                  <div className="text-white text-sm mb-1">Draw</div>
                  <div className="text-yellow-400">{match.oddsDraw}x</div>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMatch(match)
                  setSelectedTeam('team2')
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMatch?.id === match.id && selectedTeam === 'team2'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-purple-500/30 bg-purple-900/30 hover:border-purple-400'
                }`}
              >
                <div className="text-white text-sm mb-1">{match.team2}</div>
                <div className="text-green-400">{match.odds2}x</div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedMatch && selectedTeam && (
        <div className="bg-purple-900/30 rounded-lg border-2 border-purple-500 p-6 space-y-4">
          <h3 className="text-purple-200 text-center">Place Your Bet</h3>
          
          <div className="bg-purple-900/50 p-4 rounded-lg">
            <p className="text-purple-300 text-sm">Selected:</p>
            <p className="text-white">
              {selectedTeam === 'team1' ? selectedMatch.team1 : 
               selectedTeam === 'team2' ? selectedMatch.team2 : 'Draw'}
            </p>
            <p className="text-green-400">
              Odds: {selectedTeam === 'team1' ? selectedMatch.odds1 : 
                     selectedTeam === 'team2' ? selectedMatch.odds2 : 
                     selectedMatch.oddsDraw}x
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-purple-200">Bet Amount (FRW)</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter bet amount"
              className="bg-purple-900/30 border-purple-500/50 text-white"
            />
          </div>

          {betAmount && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center">
              <p className="text-green-400">
                Potential Win: {(parseFloat(betAmount) * (selectedTeam === 'team1' ? selectedMatch.odds1 : 
                                                           selectedTeam === 'team2' ? selectedMatch.odds2 : 
                                                           selectedMatch.oddsDraw || 1)).toFixed(0)} FRW
              </p>
            </div>
          )}

          <Button
            onClick={placeBet}
            disabled={!betAmount || parseFloat(betAmount) > wallet}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Place Bet
          </Button>
        </div>
      )}
    </div>
  )
}
