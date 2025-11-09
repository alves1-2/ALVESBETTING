import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plane, TrendingUp, Volume2, VolumeX, Users } from 'lucide-react'
import { soundManager } from '../../utils/sounds'
import { motion, AnimatePresence } from 'motion/react'

interface CrashGameProps {
  wallet: number
  onBetPlaced: (betAmount: number, won: boolean, winAmount: number) => void
}

interface HistoryItem {
  multiplier: number
  color: string
}

interface LiveBet {
  username: string
  amount: number
  multiplier?: number
  cashedOut: boolean
}

export function CrashGame({ wallet, onBetPlaced }: CrashGameProps) {
  // Bet states
  const [betAmount1, setBetAmount1] = useState('')
  const [betAmount2, setBetAmount2] = useState('')
  const [autoCashout1, setAutoCashout1] = useState('')
  const [autoCashout2, setAutoCashout2] = useState('')
  
  // Game states
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting')
  const [countdown, setCountdown] = useState(5)
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(0)
  
  // Bet tracking
  const [bet1Active, setBet1Active] = useState(false)
  const [bet2Active, setBet2Active] = useState(false)
  const [bet1CashedOut, setBet1CashedOut] = useState(false)
  const [bet2CashedOut, setBet2CashedOut] = useState(false)
  const [bet1Multiplier, setBet1Multiplier] = useState(0)
  const [bet2Multiplier, setBet2Multiplier] = useState(0)
  
  // Sound
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // History
  const [history, setHistory] = useState<HistoryItem[]>([
    { multiplier: 2.34, color: 'text-purple-400' },
    { multiplier: 1.56, color: 'text-blue-400' },
    { multiplier: 8.90, color: 'text-green-400' },
    { multiplier: 1.02, color: 'text-red-400' },
    { multiplier: 3.45, color: 'text-purple-400' },
  ])
  
  // Live bets simulation
  const [liveBets, setLiveBets] = useState<LiveBet[]>([
    { username: 'Player1', amount: 500, cashedOut: false },
    { username: 'Player2', amount: 1000, cashedOut: false },
    { username: 'Player3', amount: 750, cashedOut: false },
  ])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  // Generate random crash point
  const generateCrashPoint = () => {
    const random = Math.random()
    if (random < 0.33) {
      return 1.00 + Math.random() * 0.5 // 1.00x - 1.50x (33%)
    } else if (random < 0.66) {
      return 1.50 + Math.random() * 1.5 // 1.50x - 3.00x (33%)
    } else if (random < 0.90) {
      return 3.00 + Math.random() * 4.0 // 3.00x - 7.00x (24%)
    } else {
      return 7.00 + Math.random() * 13.0 // 7.00x - 20.00x (10%)
    }
  }

  // Draw trajectory on canvas
  const drawTrajectory = (currentMultiplier: number, crashed: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (i * height) / 10)
      ctx.lineTo(width, (i * height) / 10)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo((i * width) / 10, 0)
      ctx.lineTo((i * width) / 10, height)
      ctx.stroke()
    }

    // Draw trajectory curve
    if (currentMultiplier > 1.00) {
      const progress = (Date.now() - startTimeRef.current) / 100
      
      ctx.strokeStyle = crashed ? '#ef4444' : '#10b981'
      ctx.lineWidth = 3
      ctx.beginPath()
      
      for (let i = 0; i <= progress; i++) {
        const t = i / 100
        const x = (t / 20) * width
        const mult = 1 + Math.pow(t * 0.15, 1.5)
        const y = height - (mult - 1) * (height / 10)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      
      // Draw plane at the end of trajectory
      const finalT = progress / 100
      const planeX = (finalT / 20) * width
      const planeMult = currentMultiplier
      const planeY = height - (planeMult - 1) * (height / 10)
      
      // Draw plane icon (simple triangle)
      ctx.fillStyle = crashed ? '#ef4444' : '#10b981'
      ctx.beginPath()
      ctx.moveTo(planeX, planeY - 10)
      ctx.lineTo(planeX - 8, planeY + 5)
      ctx.lineTo(planeX + 8, planeY + 5)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Start countdown
  useEffect(() => {
    if (gameState === 'waiting') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            startFlight()
            return 5
          }
          soundManager.countdown()
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState])

  // Start flight
  const startFlight = () => {
    const crash = generateCrashPoint()
    setCrashPoint(parseFloat(crash.toFixed(2)))
    setGameState('flying')
    setMultiplier(1.00)
    startTimeRef.current = Date.now()
    soundManager.planeStart()
    
    let elapsed = 0
    intervalRef.current = setInterval(() => {
      elapsed += 50
      const t = elapsed / 1000
      // Exponential growth: multiplier = e^(0.1 * t)
      const newMultiplier = Math.pow(Math.E, 0.15 * t)
      const currentMult = parseFloat(newMultiplier.toFixed(2))
      
      setMultiplier(currentMult)
      drawTrajectory(currentMult, false)

      // Play flying sound periodically
      if (elapsed % 500 === 0) {
        soundManager.planeFlying()
      }

      // Check auto cashouts
      if (bet1Active && !bet1CashedOut && autoCashout1 && currentMult >= parseFloat(autoCashout1)) {
        cashOut(1)
      }
      if (bet2Active && !bet2CashedOut && autoCashout2 && currentMult >= parseFloat(autoCashout2)) {
        cashOut(2)
      }

      // Check crash
      if (currentMult >= crash) {
        crashGame()
      }
    }, 50)
  }

  // Crash the game
  const crashGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setGameState('crashed')
    drawTrajectory(crashPoint, true)
    soundManager.planeCrash()
    
    // Handle losses
    if (bet1Active && !bet1CashedOut) {
      onBetPlaced(parseFloat(betAmount1), false, 0)
    }
    if (bet2Active && !bet2CashedOut) {
      onBetPlaced(parseFloat(betAmount2), false, 0)
    }

    // Add to history
    const color = crashPoint < 2 ? 'text-red-400' : 
                  crashPoint < 5 ? 'text-blue-400' : 
                  crashPoint < 10 ? 'text-purple-400' : 'text-green-400'
    setHistory(prev => [{ multiplier: crashPoint, color }, ...prev.slice(0, 9)])

    // Reset after 3 seconds
    setTimeout(() => {
      setGameState('waiting')
      setCountdown(5)
      setMultiplier(1.00)
      setBet1Active(false)
      setBet2Active(false)
      setBet1CashedOut(false)
      setBet2CashedOut(false)
      setBet1Multiplier(0)
      setBet2Multiplier(0)
      
      // Reset live bets
      setLiveBets([
        { username: 'Player' + Math.floor(Math.random() * 100), amount: Math.floor(Math.random() * 2000) + 500, cashedOut: false },
        { username: 'Player' + Math.floor(Math.random() * 100), amount: Math.floor(Math.random() * 2000) + 500, cashedOut: false },
        { username: 'Player' + Math.floor(Math.random() * 100), amount: Math.floor(Math.random() * 2000) + 500, cashedOut: false },
      ])
    }, 3000)
  }

  // Quick bet buttons
  const quickBet = (betNumber: 1 | 2, multiplier: number) => {
    const currentBet = parseFloat(betNumber === 1 ? betAmount1 : betAmount2) || 100
    const newBet = multiplier === 0 ? wallet : currentBet * multiplier
    const setBet = betNumber === 1 ? setBetAmount1 : setBetAmount2
    setBet(Math.min(newBet, wallet).toFixed(0))
    soundManager.buttonClick()
  }

  // Place bet
  const placeBet = (betNumber: 1 | 2) => {
    const amount = betNumber === 1 ? betAmount1 : betAmount2
    const bet = parseFloat(amount)
    
    if (!bet || bet > wallet) {
      soundManager.error()
      return
    }

    soundManager.betPlaced()
    if (betNumber === 1) {
      setBet1Active(true)
      setBet1CashedOut(false)
    } else {
      setBet2Active(true)
      setBet2CashedOut(false)
    }
  }

  // Cancel bet
  const cancelBet = (betNumber: 1 | 2) => {
    soundManager.buttonClick()
    if (betNumber === 1) {
      setBet1Active(false)
    } else {
      setBet2Active(false)
    }
  }

  // Cash out
  const cashOut = (betNumber: 1 | 2) => {
    if (gameState !== 'flying') return

    const amount = betNumber === 1 ? betAmount1 : betAmount2
    const bet = parseFloat(amount)
    const winAmount = bet * multiplier

    soundManager.cashOut()
    if (betNumber === 1 && bet1Active && !bet1CashedOut) {
      setBet1CashedOut(true)
      setBet1Multiplier(multiplier)
      onBetPlaced(bet, true, winAmount)
    } else if (betNumber === 2 && bet2Active && !bet2CashedOut) {
      setBet2CashedOut(true)
      setBet2Multiplier(multiplier)
      onBetPlaced(bet, true, winAmount)
    }
  }

  // Simulate live cashouts
  useEffect(() => {
    if (gameState === 'flying' && multiplier > 1.5) {
      const shouldCashout = Math.random() > 0.95
      if (shouldCashout) {
        setLiveBets(prev => prev.map((bet, idx) => 
          idx === Math.floor(Math.random() * prev.length) && !bet.cashedOut
            ? { ...bet, multiplier: multiplier, cashedOut: true }
            : bet
        ))
      }
    }
  }, [multiplier, gameState])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* History Bar - BetPawa Style */}
      <div className="bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 p-4 rounded-xl border border-purple-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 text-sm">Recent Results</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-purple-300 hover:text-purple-100 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {history.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-2 rounded-lg ${item.color} font-bold bg-black/50 border border-current/30 flex-shrink-0 text-sm`}
            >
              {item.multiplier.toFixed(2)}x
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Game Canvas */}
        <div className="lg:col-span-2 space-y-2">
          <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 rounded-xl border-2 border-purple-500/50 overflow-hidden h-96 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            {/* Stars background */}
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: Math.random() * 0.7 + 0.3
                  }}
                />
              ))}
            </div>

            {/* Canvas for trajectory */}
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="absolute inset-0 w-full h-full"
            />

            {/* Multiplier Display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {gameState === 'waiting' ? (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <div className="text-white/50 text-xl mb-2">NEXT ROUND IN</div>
                    <div className="text-7xl text-purple-400 font-bold animate-pulse">
                      {countdown}
                    </div>
                  </motion.div>
                ) : gameState === 'flying' ? (
                  <motion.div
                    key="flying"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <Plane className="w-20 h-20 text-green-400 mx-auto mb-4 animate-pulse" />
                    <div className="text-8xl text-green-400 font-bold drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                      {multiplier.toFixed(2)}x
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="crashed"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-center"
                  >
                    <div className="text-6xl text-red-500 font-bold mb-2 animate-bounce">
                      FLEW AWAY!
                    </div>
                    <div className="text-4xl text-red-400">
                      @ {crashPoint.toFixed(2)}x
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Live Bets Panel */}
        <div className="bg-gradient-to-br from-purple-900/30 to-black/50 rounded-xl border border-purple-500/30 p-4 max-h-96 overflow-y-auto backdrop-blur-sm">
          <h3 className="text-purple-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Live Bets ({liveBets.length})
          </h3>
          <div className="space-y-2">
            {liveBets.map((bet, idx) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border transition-all ${
                  bet.cashedOut
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-purple-900/30 border-purple-500/30'
                }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                      {bet.username[0]}
                    </div>
                    <span className="text-purple-200">{bet.username}</span>
                  </div>
                  <span className="text-yellow-400">{bet.amount} FRW</span>
                </div>
                {bet.cashedOut && bet.multiplier && (
                  <div className="text-green-400 text-xs mt-2 flex justify-between">
                    <span>@ {bet.multiplier.toFixed(2)}x</span>
                    <span className="font-bold">+{(bet.amount * bet.multiplier - bet.amount).toFixed(0)} FRW</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Betting Panel - BetPawa Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bet 1 */}
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-6 rounded-xl border-2 border-purple-500/50 backdrop-blur-sm">
          <h3 className="text-purple-300 mb-4 text-lg">Bet 1</h3>
          <div className="space-y-4">
            <div>
              <label className="text-purple-200 text-sm mb-2 block">Bet Amount (FRW)</label>
              <Input
                type="number"
                value={betAmount1}
                onChange={(e) => setBetAmount1(e.target.value)}
                disabled={bet1Active || gameState === 'flying'}
                className="bg-black/50 border-purple-500/50 text-white h-12 text-lg"
                placeholder="100"
              />
              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Button
                  onClick={() => quickBet(1, 0.5)}
                  disabled={bet1Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
                >
                  1/2
                </Button>
                <Button
                  onClick={() => quickBet(1, 2)}
                  disabled={bet1Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
                >
                  2x
                </Button>
                <Button
                  onClick={() => quickBet(1, 0)}
                  disabled={bet1Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
                >
                  Max
                </Button>
                <Button
                  onClick={() => setBetAmount1('')}
                  disabled={bet1Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-purple-200 text-sm mb-2 block">Auto Cash Out (Optional)</label>
              <Input
                type="number"
                value={autoCashout1}
                onChange={(e) => setAutoCashout1(e.target.value)}
                disabled={bet1Active || gameState === 'flying'}
                className="bg-black/50 border-purple-500/50 text-white h-12 text-lg"
                placeholder="2.00x"
                step="0.1"
              />
            </div>

            {!bet1Active && gameState === 'waiting' ? (
              <Button
                onClick={() => placeBet(1)}
                disabled={!betAmount1 || parseFloat(betAmount1) > wallet || parseFloat(betAmount1) <= 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                PLACE BET
              </Button>
            ) : bet1Active && gameState === 'waiting' ? (
              <Button
                onClick={() => cancelBet(1)}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 h-14 text-lg"
              >
                CANCEL BET
              </Button>
            ) : bet1Active && gameState === 'flying' && !bet1CashedOut ? (
              <Button
                onClick={() => cashOut(1)}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 h-14 text-lg animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]"
              >
                💰 CASH OUT {multiplier.toFixed(2)}x
              </Button>
            ) : bet1CashedOut ? (
              <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-lg text-center">
                <div className="text-green-400 text-xl mb-1">✓ Cashed Out!</div>
                <div className="text-white text-2xl font-bold">
                  {(parseFloat(betAmount1) * bet1Multiplier).toFixed(0)} FRW
                </div>
                <div className="text-green-300 text-sm mt-1">
                  @ {bet1Multiplier.toFixed(2)}x
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bet 2 */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-6 rounded-xl border-2 border-blue-500/50 backdrop-blur-sm">
          <h3 className="text-blue-300 mb-4 text-lg">Bet 2</h3>
          <div className="space-y-4">
            <div>
              <label className="text-blue-200 text-sm mb-2 block">Bet Amount (FRW)</label>
              <Input
                type="number"
                value={betAmount2}
                onChange={(e) => setBetAmount2(e.target.value)}
                disabled={bet2Active || gameState === 'flying'}
                className="bg-black/50 border-blue-500/50 text-white h-12 text-lg"
                placeholder="100"
              />
              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Button
                  onClick={() => quickBet(2, 0.5)}
                  disabled={bet2Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-500/50 text-blue-200 hover:bg-blue-800/40"
                >
                  1/2
                </Button>
                <Button
                  onClick={() => quickBet(2, 2)}
                  disabled={bet2Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-500/50 text-blue-200 hover:bg-blue-800/40"
                >
                  2x
                </Button>
                <Button
                  onClick={() => quickBet(2, 0)}
                  disabled={bet2Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-500/50 text-blue-200 hover:bg-blue-800/40"
                >
                  Max
                </Button>
                <Button
                  onClick={() => setBetAmount2('')}
                  disabled={bet2Active || gameState === 'flying'}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-500/50 text-blue-200 hover:bg-blue-800/40"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-blue-200 text-sm mb-2 block">Auto Cash Out (Optional)</label>
              <Input
                type="number"
                value={autoCashout2}
                onChange={(e) => setAutoCashout2(e.target.value)}
                disabled={bet2Active || gameState === 'flying'}
                className="bg-black/50 border-blue-500/50 text-white h-12 text-lg"
                placeholder="2.00x"
                step="0.1"
              />
            </div>

            {!bet2Active && gameState === 'waiting' ? (
              <Button
                onClick={() => placeBet(2)}
                disabled={!betAmount2 || parseFloat(betAmount2) > wallet || parseFloat(betAmount2) <= 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                PLACE BET
              </Button>
            ) : bet2Active && gameState === 'waiting' ? (
              <Button
                onClick={() => cancelBet(2)}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 h-14 text-lg"
              >
                CANCEL BET
              </Button>
            ) : bet2Active && gameState === 'flying' && !bet2CashedOut ? (
              <Button
                onClick={() => cashOut(2)}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 h-14 text-lg animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]"
              >
                💰 CASH OUT {multiplier.toFixed(2)}x
              </Button>
            ) : bet2CashedOut ? (
              <div className="p-4 bg-green-500/20 border-2 border-green-500 rounded-lg text-center">
                <div className="text-green-400 text-xl mb-1">✓ Cashed Out!</div>
                <div className="text-white text-2xl font-bold">
                  {(parseFloat(betAmount2) * bet2Multiplier).toFixed(0)} FRW
                </div>
                <div className="text-green-300 text-sm mt-1">
                  @ {bet2Multiplier.toFixed(2)}x
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 p-4 rounded-xl border border-purple-500/30 text-center backdrop-blur-sm">
        <p className="text-purple-300 text-sm">
          💡 Place your bets during the countdown. Cash out before the plane flies away to win! Auto cash out will automatically secure your winnings.
        </p>
      </div>
    </div>
  )
}
