import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Volume2, VolumeX, Users, TrendingUp } from 'lucide-react'
import { soundManager } from '../../utils/sounds'
import { motion, AnimatePresence } from 'motion/react'

interface SpinWheelProps {
  wallet: number
  onBetPlaced: (betAmount: number, won: boolean, winAmount: number) => void
}

interface LivePlayer {
  username: string
  bet: number
  multiplier: number
  won: boolean
}

export function SpinWheel({ wallet, onBetPlaced }: SpinWheelProps) {
  const [betAmount, setBetAmount] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ multiplier: number; won: boolean } | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [tickCount, setTickCount] = useState(0)
  const [recentWins, setRecentWins] = useState<number[]>([2.5, 1.2, 5.0, 0.5, 3.0, 10.0, 1.5])
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([
    { username: 'Player1', bet: 500, multiplier: 2.5, won: true },
    { username: 'Player2', bet: 1000, multiplier: 5.0, won: true },
    { username: 'Player3', bet: 300, multiplier: 0.5, won: false },
  ])

  const multipliers = [0.5, 2.0, 1.0, 0.2, 3.0, 0.1, 1.5, 5.0, 0.3, 10.0, 0.7, 1.2]

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (spinning) {
      const interval = setInterval(() => {
        setTickCount(prev => prev + 1)
        soundManager.spinTick()
      }, 100)
      return () => clearInterval(interval)
    } else {
      setTickCount(0)
    }
  }, [spinning])

  const quickBet = (multiplier: number) => {
    const currentBet = parseFloat(betAmount) || 100
    const newBet = multiplier === 0 ? wallet : currentBet * multiplier
    setBetAmount(Math.min(newBet, wallet).toFixed(0))
    soundManager.buttonClick()
  }

  const spin = () => {
    const bet = parseFloat(betAmount)
    if (!bet || bet > wallet || bet <= 0) {
      soundManager.error()
      return
    }

    soundManager.spinStart()
    soundManager.betPlaced()
    setSpinning(true)
    setResult(null)

    const randomIndex = Math.floor(Math.random() * multipliers.length)
    const multiplier = multipliers[randomIndex]
    const degrees = 360 * 8 + (randomIndex * (360 / multipliers.length))
    
    setRotation(degrees)

    setTimeout(() => {
      const winAmount = bet * multiplier
      const won = multiplier >= 1.0
      setResult({ multiplier, won })
      
      if (won) {
        soundManager.spinWin()
      } else {
        soundManager.spinLose()
      }
      
      onBetPlaced(bet, won, winAmount)
      setSpinning(false)
      
      // Add to recent wins
      setRecentWins(prev => [multiplier, ...prev.slice(0, 6)])
    }, 4000)
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
            <Users className="w-4 h-4" />
            <span>Live Players</span>
          </div>
          <div className="text-white text-2xl">{livePlayers.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Biggest Win</span>
          </div>
          <div className="text-white text-2xl">{Math.max(...recentWins).toFixed(1)}x</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-300 text-sm mb-2">
            <span>Recent Spins</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {recentWins.slice(0, 7).map((mult, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded ${
                  mult >= 1.0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                }`}
              >
                {mult}x
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Wheel Container */}
      <div className="bg-gradient-to-br from-purple-900/30 to-black/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
        <div className="relative w-80 h-80 mx-auto mb-6">
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
          
          {/* Wheel */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
            <svg
              className="w-full h-full transition-transform ease-out"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '4000ms' : '0ms'
              }}
              viewBox="0 0 100 100"
            >
              {multipliers.map((mult, i) => {
                const angle = (i * 360) / multipliers.length
                const nextAngle = ((i + 1) * 360) / multipliers.length
                const color = mult >= 2.0 ? '#10b981' : mult >= 1.0 ? '#3b82f6' : '#ef4444'
                
                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${50 + 50 * Math.cos((angle * Math.PI) / 180)} ${50 + 50 * Math.sin((angle * Math.PI) / 180)} A 50 50 0 0 1 ${50 + 50 * Math.cos((nextAngle * Math.PI) / 180)} ${50 + 50 * Math.sin((nextAngle * Math.PI) / 180)} Z`}
                      fill={color}
                      opacity="0.9"
                      stroke="#1a1a1a"
                      strokeWidth="0.5"
                    />
                    <text
                      x={50 + 32 * Math.cos(((angle + nextAngle) / 2 * Math.PI) / 180)}
                      y={50 + 32 * Math.sin(((angle + nextAngle) / 2 * Math.PI) / 180)}
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {mult}x
                    </text>
                  </g>
                )
              })}
              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="url(#wheelGradient)" />
              <defs>
                <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400 z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className={`mb-6 p-6 rounded-xl border-2 text-center ${
                result.won 
                  ? 'border-green-500 bg-gradient-to-br from-green-500/20 to-green-600/20' 
                  : 'border-red-500 bg-gradient-to-br from-red-500/20 to-red-600/20'
              }`}
            >
              <div className="text-4xl mb-2">{result.won ? '🎉' : '💔'}</div>
              <p className="text-white text-2xl mb-2">
                {result.won ? 'Winner!' : 'Better Luck Next Time'}
              </p>
              <p className="text-white text-xl">
                Multiplier: <span className={`${result.won ? 'text-green-400' : 'text-red-400'} font-bold`}>{result.multiplier}x</span>
              </p>
              {result.won && (
                <p className="text-green-300 mt-2">
                  Won: {(parseFloat(betAmount) * result.multiplier).toFixed(0)} FRW
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Betting Controls */}
        <div className="space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-purple-200">Bet Amount (FRW)</label>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-purple-300 hover:text-purple-100 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter bet amount"
              disabled={spinning}
              className="bg-purple-900/30 border-purple-500/50 text-white text-lg h-12"
            />
          </div>

          {/* Quick Bet Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => quickBet(0.5)}
              disabled={spinning}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              1/2
            </Button>
            <Button
              onClick={() => quickBet(2)}
              disabled={spinning}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              2x
            </Button>
            <Button
              onClick={() => quickBet(0)}
              disabled={spinning}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              Max
            </Button>
            <Button
              onClick={() => setBetAmount('')}
              disabled={spinning}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              Clear
            </Button>
          </div>

          <Button
            onClick={spin}
            disabled={spinning || !betAmount || parseFloat(betAmount) > wallet || parseFloat(betAmount) <= 0}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 h-14 text-lg shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all"
          >
            {spinning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🎯</span> Spinning... {tickCount}
              </span>
            ) : (
              'SPIN NOW'
            )}
          </Button>
        </div>
      </div>

      {/* Live Players */}
      <div className="bg-gradient-to-br from-purple-900/20 to-black/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
        <h3 className="text-purple-200 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Recent Players
        </h3>
        <div className="space-y-2">
          {livePlayers.map((player, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                  {player.username[0]}
                </div>
                <div>
                  <div className="text-white text-sm">{player.username}</div>
                  <div className="text-purple-300 text-xs">{player.bet} FRW</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg ${
                player.won ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {player.multiplier}x
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
