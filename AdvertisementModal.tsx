import { useState } from 'react'
import { Button } from './ui/button'
import { X, Minimize2, Maximize2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { AlvesbettLogo } from './AlvesbettLogo'
import { motion, AnimatePresence } from 'motion/react'

interface AdvertisementModalProps {
  onLikeVideo: () => void
}

export function AdvertisementModal({ onLikeVideo }: AdvertisementModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [liked, setLiked] = useState(false)

  const handleLike = () => {
    if (!liked) {
      setLiked(true)
      onLikeVideo()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isMinimized ? 0.25 : 1, 
          opacity: 1,
          x: isMinimized ? -250 : 0,
          y: isMinimized ? 250 : 0
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`fixed ${isMinimized ? 'bottom-4 left-4' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'} z-50`}
      >
        <div className={`bg-black rounded-lg border-2 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.6)] ${isMinimized ? 'w-24' : 'w-[85vw] max-w-md'}`}>
          {/* Controls */}
          <div className="flex items-center justify-between p-2 bg-purple-900/50 rounded-t-lg">
            <span className="text-purple-200 text-sm">ALVESBETT Promo</span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-purple-300 hover:text-purple-100 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-purple-300 hover:text-purple-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-3">
              {/* Compact Netflix-style intro */}
              <div className="relative h-32 bg-gradient-to-br from-red-600 via-purple-900 to-black rounded-lg overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <AlvesbettLogo size="lg" animated />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-purple-300 mt-2 text-sm"
                    >
                      Where Winners Are Made
                    </motion.p>
                  </div>
                </motion.div>
              </div>

              {/* Promotional content */}
              <div className="space-y-2">
                <h2 className="text-lg text-center text-purple-200">
                  🎉 Get 1000 FRW Bonus!
                </h2>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-500/30">
                    <div className="text-2xl">🎰</div>
                    <p className="text-purple-200 text-xs">Casino</p>
                  </div>
                  <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-500/30">
                    <div className="text-2xl">⚽</div>
                    <p className="text-purple-200 text-xs">Sports</p>
                  </div>
                  <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-500/30">
                    <div className="text-2xl">🚗</div>
                    <p className="text-purple-200 text-xs">VIP</p>
                  </div>
                  <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-500/30">
                    <div className="text-2xl">💰</div>
                    <p className="text-purple-200 text-xs">Wins</p>
                  </div>
                </div>
              </div>

              {/* Like/Dislike */}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleLike}
                  size="sm"
                  className={`flex items-center gap-1 text-xs ${liked ? 'bg-green-600' : 'bg-purple-600'} hover:bg-purple-700`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {liked ? '+50 FRW!' : 'Like +50 FRW'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs border-purple-500/50 text-purple-300"
                >
                  <ThumbsDown className="w-3 h-3" />
                  Skip
                </Button>
              </div>

              <p className="text-purple-300 text-xs text-center">
                Like to earn 50 FRW bonus instantly!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
