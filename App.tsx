import { useState, useEffect } from 'react'
import { Login } from './components/auth/Login'
import { Signup } from './components/auth/Signup'
import { SpinWheel } from './components/games/SpinWheel'
import { CrashGame } from './components/games/CrashGame'
import { RollingBall } from './components/games/RollingBall'
import { VIPRacingGame } from './components/games/VIPRacingGame'
import { SportsBetting } from './components/SportsBetting'
import { WalletPayment } from './components/WalletPayment'
import { GameHistory } from './components/GameHistory'
import { AdvertisementModal } from './components/AdvertisementModal'
import { AlvesbettLogo } from './components/AlvesbettLogo'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog'
import { Badge } from './components/ui/badge'
import { apiCall } from './utils/api'
import { 
  Wallet, 
  History, 
  CreditCard, 
  LogOut, 
  Dices, 
  Trophy, 
  Car,
  Instagram,
  MessageCircle
} from 'lucide-react'
import { Toaster, toast } from 'sonner@2.0.3'

export default function App() {
  const [authState, setAuthState] = useState<'login' | 'signup' | 'authenticated'>('login')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [wallet, setWallet] = useState(0)
  const [currentTab, setCurrentTab] = useState('casino')
  const [currentGame, setCurrentGame] = useState<'spin' | 'crash' | 'ball' | 'slots' | 'blackjack'>('spin')
  const [currentVIPGame, setCurrentVIPGame] = useState<'car' | 'airplane' | 'horse'>('car')
  const [instagramBonusModal, setInstagramBonusModal] = useState(false)
  const [instagramBonusClaimed, setInstagramBonusClaimed] = useState(false)

  // Load user's Instagram bonus status from profile
  useEffect(() => {
    if (userId) {
      loadUserProfile()
    }
  }, [userId])

  const loadUserProfile = async () => {
    try {
      const response = await apiCall(`/profile/${userId}`)
      if (response.success && response.profile) {
        setInstagramBonusClaimed(response.profile.instagramBonusClaimed || false)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleLoginSuccess = (uid: string, uname: string, walletAmount: number) => {
    setUserId(uid)
    setUsername(uname)
    setWallet(walletAmount)
    setAuthState('authenticated')
    toast.success(`Welcome back, ${uname}!`)
  }

  const handleSignupSuccess = (uid: string, uname: string, walletAmount: number) => {
    setUserId(uid)
    setUsername(uname)
    setWallet(walletAmount)
    setAuthState('authenticated')
    toast.success(`Account created! You received 1000 FRW bonus!`)
  }

  const handleLogout = () => {
    setAuthState('login')
    setUserId('')
    setUsername('')
    setWallet(0)
    toast.info('Logged out successfully')
  }

  const handleBetPlaced = async (betAmount: number, won: boolean, winAmount: number) => {
    try {
      // Place bet
      const betResponse = await apiCall('/place-bet', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          gameType: currentTab === 'casino' ? currentGame : currentTab === 'vip' ? currentVIPGame : 'sports',
          betAmount,
          betDetails: {}
        })
      })

      // Settle bet
      await apiCall('/settle-bet', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          betId: betResponse.betId,
          won,
          winAmount
        })
      })

      // Update wallet
      if (won) {
        setWallet(prev => prev + winAmount)
        toast.success(`You won ${winAmount.toFixed(0)} FRW! 🎉`)
      } else {
        setWallet(prev => prev - betAmount)
        toast.error(`You lost ${betAmount.toFixed(0)} FRW 😔`)
      }
    } catch (error) {
      console.error('Error processing bet:', error)
      toast.error('Error processing bet')
    }
  }

  const handleWalletUpdate = (newBalance: number) => {
    setWallet(newBalance)
  }

  const handleLikeVideo = async () => {
    try {
      const response = await apiCall('/like-video-bonus', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
      setWallet(response.newBalance)
      toast.success('You earned 50 FRW for liking the video!')
    } catch (error) {
      console.error('Error claiming like bonus:', error)
    }
  }

  const claimInstagramBonus = async () => {
    try {
      const response = await apiCall('/claim-instagram-bonus', {
        method: 'POST',
        body: JSON.stringify({ userId })
      })
      setWallet(response.newBalance)
      setInstagramBonusClaimed(true)
      toast.success('Instagram bonus claimed: 1000 FRW!')
      setInstagramBonusModal(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (authState === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => setAuthState('signup')} />
  }

  if (authState === 'signup') {
    return <Signup onSignupSuccess={handleSignupSuccess} onBackToLogin={() => setAuthState('login')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Toaster position="top-center" richColors />
      
      {/* Advertisement Modal */}
      <AdvertisementModal onLikeVideo={handleLikeVideo} />

      {/* Main Container with Neon Border */}
      <div className="min-h-screen border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-padding p-1">
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 rounded-lg">
          {/* Header */}
          <div className="bg-black/40 backdrop-blur-lg border-b-2 border-purple-500/50 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex flex-col">
                <AlvesbettLogo size="md" />
                <p className="text-purple-300 text-sm ml-16 -mt-1">Welcome, {username}!</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Age Badge */}
                <Badge className="bg-red-600 text-white border-red-400">18+</Badge>

                {/* Wallet Display */}
                <div className="bg-purple-900/50 px-4 py-2 rounded-lg border-2 border-purple-500 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span className="text-white">{wallet.toFixed(0)} FRW</span>
                </div>

                {/* Instagram Bonus */}
                <Button
                  onClick={() => setInstagramBonusModal(true)}
                  disabled={instagramBonusClaimed}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  size="sm"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  {instagramBonusClaimed ? 'Bonus Claimed' : '+1000 FRW'}
                </Button>

                {/* Logout */}
                <Button onClick={handleLogout} variant="outline" size="sm" className="border-purple-500/50 text-purple-300">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto p-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto bg-purple-900/30 border-2 border-purple-500/50">
                <TabsTrigger value="casino" className="data-[state=active]:bg-purple-600">
                  <Dices className="w-4 h-4 mr-2" />
                  Casino
                </TabsTrigger>
                <TabsTrigger value="sports" className="data-[state=active]:bg-purple-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  Sports
                </TabsTrigger>
                <TabsTrigger value="vip" className="data-[state=active]:bg-purple-600" disabled={wallet < 10000}>
                  <Car className="w-4 h-4 mr-2" />
                  VIP {wallet < 10000 && '🔒'}
                </TabsTrigger>
                <TabsTrigger value="wallet" className="data-[state=active]:bg-purple-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Casino Games */}
              <TabsContent value="casino" className="space-y-6">
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    onClick={() => setCurrentGame('spin')}
                    className={currentGame === 'spin' ? 'bg-purple-600' : 'bg-purple-900/50'}
                  >
                    🎡 Spin Wheel
                  </Button>
                  <Button
                    onClick={() => setCurrentGame('crash')}
                    className={currentGame === 'crash' ? 'bg-purple-600' : 'bg-purple-900/50'}
                  >
                    ✈️ Crash Game
                  </Button>
                  <Button
                    onClick={() => setCurrentGame('ball')}
                    className={currentGame === 'ball' ? 'bg-purple-600' : 'bg-purple-900/50'}
                  >
                    ⚽ Rolling Ball
                  </Button>
                  <Button
                    onClick={() => setCurrentGame('slots')}
                    className={currentGame === 'slots' ? 'bg-purple-600' : 'bg-purple-900/50'}
                    disabled
                  >
                    🎰 Slots (Coming Soon)
                  </Button>
                  <Button
                    onClick={() => setCurrentGame('blackjack')}
                    className={currentGame === 'blackjack' ? 'bg-purple-600' : 'bg-purple-900/50'}
                    disabled
                  >
                    🃏 Blackjack (Coming Soon)
                  </Button>
                </div>

                <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-6">
                  {currentGame === 'spin' && <SpinWheel wallet={wallet} onBetPlaced={handleBetPlaced} />}
                  {currentGame === 'crash' && <CrashGame wallet={wallet} onBetPlaced={handleBetPlaced} />}
                  {currentGame === 'ball' && <RollingBall wallet={wallet} onBetPlaced={handleBetPlaced} />}
                </div>
              </TabsContent>

              {/* Sports Betting */}
              <TabsContent value="sports">
                <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-6">
                  <SportsBetting wallet={wallet} onBetPlaced={handleBetPlaced} />
                </div>
              </TabsContent>

              {/* VIP Games */}
              <TabsContent value="vip" className="space-y-6">
                {wallet >= 10000 ? (
                  <>
                    <div className="text-center bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500 rounded-lg p-4">
                      <p className="text-yellow-400 text-xl">🌟 VIP ACCESS UNLOCKED 🌟</p>
                      <p className="text-yellow-200 text-sm">Exclusive racing games with high multipliers!</p>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => setCurrentVIPGame('car')}
                        className={currentVIPGame === 'car' ? 'bg-purple-600' : 'bg-purple-900/50'}
                      >
                        🚗 Car Racing
                      </Button>
                      <Button
                        onClick={() => setCurrentVIPGame('airplane')}
                        className={currentVIPGame === 'airplane' ? 'bg-purple-600' : 'bg-purple-900/50'}
                      >
                        ✈️ Airplane Racing
                      </Button>
                      <Button
                        onClick={() => setCurrentVIPGame('horse')}
                        className={currentVIPGame === 'horse' ? 'bg-purple-600' : 'bg-purple-900/50'}
                      >
                        🐴 Horse Racing
                      </Button>
                    </div>

                    <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-6">
                      <VIPRacingGame 
                        wallet={wallet} 
                        onBetPlaced={handleBetPlaced}
                        gameType={currentVIPGame}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-12 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-2xl text-purple-200 mb-3">VIP Access Locked</h3>
                    <p className="text-purple-300 mb-2">
                      You need at least 10,000 FRW to access VIP games
                    </p>
                    <p className="text-purple-400">
                      Current balance: {wallet.toFixed(0)} FRW
                    </p>
                    <p className="text-purple-400">
                      Needed: {(10000 - wallet).toFixed(0)} FRW more
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Wallet & Payment */}
              <TabsContent value="wallet">
                <WalletPayment userId={userId} wallet={wallet} onWalletUpdate={handleWalletUpdate} />
              </TabsContent>

              {/* Game History */}
              <TabsContent value="history">
                <GameHistory userId={userId} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="bg-black/40 backdrop-blur-lg border-t-2 border-purple-500/50 p-6 mt-12">
            <div className="max-w-7xl mx-auto text-center space-y-4">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <a 
                  href="https://instagram.com/alves_1_k"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  @alves_1_k
                </a>
                <a 
                  href="https://wa.me/250793758208"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp: 0793758208
                </a>
              </div>
              <p className="text-purple-400 text-sm">
                © 2024 ALVESBETT. Play responsibly. 18+ only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Bonus Modal */}
      <Dialog open={instagramBonusModal} onOpenChange={setInstagramBonusModal}>
        <DialogContent className="bg-gradient-to-br from-purple-900 to-blue-900 border-2 border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-purple-200">
              🎁 Instagram Bonus
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-purple-300 text-center">
              Follow us on Instagram and earn 1000 FRW bonus!
            </p>
            <div className="space-y-3">
              <a
                href="https://instagram.com/alves_1_k"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-purple-900/30 p-4 rounded-lg border border-purple-500/50 hover:border-purple-400 transition-colors"
              >
                <Instagram className="w-6 h-6 text-pink-400" />
                <div className="flex-1">
                  <p className="text-white">@alves_1_k</p>
                  <p className="text-purple-300 text-sm">Click to follow</p>
                </div>
              </a>
            </div>
            <Button
              onClick={claimInstagramBonus}
              disabled={instagramBonusClaimed}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              {instagramBonusClaimed ? 'Bonus Already Claimed' : 'Claim 1000 FRW Bonus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
