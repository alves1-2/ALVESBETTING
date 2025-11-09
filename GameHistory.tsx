import { useState, useEffect } from 'react'
import { apiCall } from '../utils/api'
import { ScrollArea } from './ui/scroll-area'
import { History } from 'lucide-react'

interface GameHistoryProps {
  userId: string
}

interface HistoryItem {
  betId: string
  gameType: string
  betAmount: number
  status: string
  winAmount: number
  timestamp: number
}

export function GameHistory({ userId }: GameHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [userId])

  const loadHistory = async () => {
    try {
      const response = await apiCall(`/history/${userId}`)
      setHistory(response.history)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGameIcon = (gameType: string) => {
    const icons: Record<string, string> = {
      spinwheel: '🎡',
      crash: '✈️',
      rollingball: '⚽',
      slots: '🎰',
      blackjack: '🃏',
      sports: '🏆',
      car: '���',
      airplane: '✈️',
      horse: '🐴'
    }
    return icons[gameType] || '🎮'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-purple-300">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <History className="w-12 h-12 mx-auto mb-3 text-purple-400" />
        <h2 className="text-3xl text-purple-200 mb-2">Game History</h2>
        <p className="text-purple-300">Your betting history</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-12 text-center">
          <p className="text-purple-300">No games played yet. Start betting to see your history!</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px] rounded-lg border-2 border-purple-500/50">
          <div className="space-y-3 p-4">
            {history.map((item) => (
              <div
                key={item.betId}
                className={`bg-purple-900/20 rounded-lg border-2 p-4 ${
                  item.status === 'won' ? 'border-green-500/50' : 'border-red-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getGameIcon(item.gameType)}</span>
                    <div>
                      <p className="text-white capitalize">{item.gameType.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-purple-300 text-sm">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-200 text-sm">Bet: {item.betAmount} FRW</p>
                    {item.status === 'won' ? (
                      <p className="text-green-400">Won: +{item.winAmount.toFixed(0)} FRW</p>
                    ) : (
                      <p className="text-red-400">Lost: -{item.betAmount} FRW</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
