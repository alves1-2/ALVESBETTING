import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Car, Plane as PlaneIcon, Volume2, VolumeX, Trophy } from 'lucide-react'
import { soundManager } from '../../utils/sounds'
import { motion, AnimatePresence } from 'motion/react'

interface VIPRacingGameProps {
  wallet: number
  onBetPlaced: (betAmount: number, won: boolean, winAmount: number) => void
  gameType: 'car' | 'airplane' | 'horse'
}

interface ObstacleCar {
  id: number
  position: number
  lane: number
  multiplier: number
}

export function VIPRacingGame({ wallet, onBetPlaced, gameType }: VIPRacingGameProps) {
  const [betAmount, setBetAmount] = useState('')
  const [gameActive, setGameActive] = useState(false)
  const [playerLane, setPlayerLane] = useState(1) // 0, 1, 2 (left, center, right)
  const [playerPosition, setPlayerPosition] = useState(0)
  const [speed, setSpeed] = useState(5)
  const [obstacles, setObstacles] = useState<ObstacleCar[]>([])
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const obstacleIdRef = useRef(0)

  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  const icons = {
    car: '🚗',
    airplane: '✈️',
    horse: '🐴'
  }

  const quickBet = (multiplier: number) => {
    const currentBet = parseFloat(betAmount) || 100
    const newBet = multiplier === 0 ? wallet : currentBet * multiplier
    setBetAmount(Math.min(newBet, wallet).toFixed(0))
    soundManager.buttonClick()
  }

  const startGame = () => {
    const bet = parseFloat(betAmount)
    if (!bet || bet > wallet || bet < 100) {
      soundManager.error()
      return
    }

    soundManager.betPlaced()
    setCountdown(3)
    
    // Countdown before start
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval)
          beginRace()
          return 0
        }
        soundManager.countdown()
        return prev - 1
      })
    }, 1000)
  }

  const beginRace = () => {
    soundManager.engineStart()
    setGameActive(true)
    setPlayerLane(1)
    setPlayerPosition(0)
    setSpeed(5)
    setObstacles([])
    setCurrentMultiplier(1.0)
    setGameOver(false)
    setWon(false)
    obstacleIdRef.current = 0

    // Game loop
    let revCount = 0
    gameLoopRef.current = setInterval(() => {
      setPlayerPosition(prev => prev + 5)
      
      // Engine rev sound
      revCount++
      if (revCount % 10 === 0) {
        soundManager.engineRev()
      }
      
      // Spawn obstacles randomly
      if (Math.random() < 0.25) {
        const newObstacle: ObstacleCar = {
          id: obstacleIdRef.current++,
          position: 100,
          lane: Math.floor(Math.random() * 3),
          multiplier: parseFloat((1.1 + Math.random() * 2.9).toFixed(1)) // 1.1x to 4.0x
        }
        setObstacles(prev => [...prev, newObstacle])
      }

      // Move obstacles
      setObstacles(prev => 
        prev
          .map(obs => ({ ...obs, position: obs.position - 3 }))
          .filter(obs => obs.position > -20)
      )

      // Increase multiplier over time
      setCurrentMultiplier(prev => parseFloat((prev + 0.01).toFixed(2)))
    }, 100)
  }

  const stopGame = (crashed: boolean) => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    setGameActive(false)
    setGameOver(true)

    const bet = parseFloat(betAmount)
    if (crashed) {
      soundManager.collision()
      setWon(false)
      onBetPlaced(bet, false, 0)
    } else {
      soundManager.raceWin()
      setWon(true)
      const winAmount = bet * currentMultiplier
      onBetPlaced(bet, true, winAmount)
    }
  }

  const handleControl = (action: 'left' | 'right' | 'brake' | 'front') => {
    if (!gameActive) return

    soundManager.buttonClick()
    if (action === 'left' && playerLane > 0) {
      setPlayerLane(prev => prev - 1)
    } else if (action === 'right' && playerLane < 2) {
      setPlayerLane(prev => prev + 1)
    } else if (action === 'brake') {
      setSpeed(prev => Math.max(2, prev - 1))
    } else if (action === 'front') {
      setSpeed(prev => Math.min(10, prev + 1))
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameActive) return
      
      switch(e.key) {
        case 'ArrowLeft':
          handleControl('left')
          break
        case 'ArrowRight':
          handleControl('right')
          break
        case 'ArrowUp':
          handleControl('front')
          break
        case 'ArrowDown':
          handleControl('brake')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameActive, playerLane])

  // Collision detection
  useEffect(() => {
    if (!gameActive) return

    obstacles.forEach(obs => {
      // Check if obstacle is at player's position and same lane
      if (obs.lane === playerLane && Math.abs(obs.position - 50) < 10) {
        // Collision detected!
        stopGame(true)
      } else if (obs.lane === playerLane && obs.position < 50 && obs.position > 30) {
        // Passed obstacle successfully - add its multiplier
        setCurrentMultiplier(prev => parseFloat((prev + obs.multiplier * 0.1).toFixed(2)))
      }
    })
  }, [obstacles, playerLane, gameActive])

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
            <Car className="w-4 h-4" />
            <span>Game Type</span>
          </div>
          <div className="text-white text-xl capitalize">{gameType} Racing</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-300 text-sm mb-2">
            <Trophy className="w-4 h-4" />
            <span>Current Multiplier</span>
          </div>
          <div className="text-white text-2xl">{currentMultiplier.toFixed(2)}x</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
            <span>Potential Win</span>
          </div>
          <div className="text-white text-xl">
            {betAmount && !isNaN(parseFloat(betAmount)) 
              ? (parseFloat(betAmount) * currentMultiplier).toFixed(0) 
              : '0'} FRW
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="bg-gradient-to-br from-purple-900/30 to-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-purple-200 text-xl capitalize">
            VIP {gameType} Racing
          </h3>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-purple-300 hover:text-purple-100 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative h-96 bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          {/* Road lanes */}
          <div className="absolute inset-0 flex">
            {[0, 1, 2].map(lane => (
              <div key={lane} className="flex-1 border-r-2 border-dashed border-yellow-400/40 relative">
                {/* Lane markers animation */}
                {gameActive && (
                  <div className="absolute inset-0 flex flex-col justify-around opacity-30">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-full h-4 bg-yellow-400/50"
                        animate={{ y: ['0%', '1200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.25 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Player vehicle */}
          <motion.div 
            className="absolute bottom-20 text-5xl drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"
            animate={{ 
              left: `${playerLane * 33.33 + 12}%`,
              rotate: gameActive ? [0, -2, 0, 2, 0] : 0
            }}
            transition={{ 
              left: { type: "spring", stiffness: 300, damping: 30 },
              rotate: { duration: 0.5, repeat: Infinity }
            }}
          >
            <div className="relative">
              <div className="text-center">{icons[gameType]}</div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
                {betAmount || 0} FRW
              </div>
            </div>
          </motion.div>

          {/* Obstacles */}
          <AnimatePresence>
            {obstacles.map(obs => (
              <motion.div
                key={obs.id}
                className="absolute text-4xl"
                style={{
                  left: `${obs.lane * 33.33 + 12}%`,
                  bottom: `${obs.position}%`,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="relative drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                  <div className="text-center">🚙</div>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                    +{obs.multiplier}x
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Countdown */}
          <AnimatePresence>
            {countdown > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
              >
                <div className="text-9xl text-green-400 font-bold drop-shadow-[0_0_30px_rgba(34,197,94,1)]">
                  {countdown}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 flex items-center justify-center z-10"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`text-8xl mb-4 ${won ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {won ? '🏆' : '💥'}
                  </motion.div>
                  <div className={`text-3xl mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
                    {won ? 'Cash Out Success!' : 'Crashed!'}
                  </div>
                  {won && (
                    <div className="text-white text-2xl mt-4">
                      Won: <span className="text-green-400 font-bold">{(parseFloat(betAmount) * currentMultiplier).toFixed(0)} FRW</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          <Button
            onClick={() => handleControl('left')}
            disabled={!gameActive}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-14"
          >
            ← LEFT
          </Button>
          <div className="space-y-2">
            <Button
              onClick={() => handleControl('front')}
              disabled={!gameActive}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-14"
            >
              ↑ SPEED
            </Button>
            <Button
              onClick={() => handleControl('brake')}
              disabled={!gameActive}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14"
            >
              ↓ BRAKE
            </Button>
          </div>
          <Button
            onClick={() => handleControl('right')}
            disabled={!gameActive}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-14"
          >
            RIGHT →
          </Button>
        </div>
      </div>

      {/* Betting Controls */}
      <div className="bg-gradient-to-br from-purple-900/30 to-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
        <div className="space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <label className="text-purple-200">Bet Amount (FRW) - Minimum: 100</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter bet amount (min 100)"
              disabled={gameActive || countdown > 0}
              className="bg-purple-900/30 border-purple-500/50 text-white text-lg h-12"
            />
          </div>

          {/* Quick Bet Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => quickBet(0.5)}
              disabled={gameActive || countdown > 0}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              1/2
            </Button>
            <Button
              onClick={() => quickBet(2)}
              disabled={gameActive || countdown > 0}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              2x
            </Button>
            <Button
              onClick={() => quickBet(0)}
              disabled={gameActive || countdown > 0}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              Max
            </Button>
            <Button
              onClick={() => setBetAmount('')}
              disabled={gameActive || countdown > 0}
              variant="outline"
              className="bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-800/40"
            >
              Clear
            </Button>
          </div>

          <div className="flex gap-3">
            {!gameActive && countdown === 0 ? (
              <Button
                onClick={startGame}
                disabled={!betAmount || parseFloat(betAmount) < 100 || parseFloat(betAmount) > wallet}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                🏁 START RACE
              </Button>
            ) : gameActive ? (
              <Button
                onClick={() => stopGame(false)}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 h-14 text-lg animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]"
              >
                💰 CASH OUT ({currentMultiplier.toFixed(2)}x)
              </Button>
            ) : null}
          </div>

          <p className="text-purple-300 text-sm text-center">
            💡 Use arrow keys or buttons to control! Avoid hitting other vehicles and pass them to multiply your bet. Cash out anytime to secure your winnings!
          </p>
        </div>
      </div>
    </div>
  )
}
