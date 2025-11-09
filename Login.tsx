import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { apiCall } from '../../utils/api'
import { AlvesbettLogo } from '../AlvesbettLogo'

interface LoginProps {
  onLoginSuccess: (userId: string, username: string, wallet: number) => void
  onSwitchToSignup: () => void
}

export function Login({ onLoginSuccess, onSwitchToSignup }: LoginProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+250')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleCreateDemoAccount = async () => {
    setError('')
    setSuccessMessage('')
    setLoading(true)
    
    try {
      const response = await apiCall('/create-demo-user', {
        method: 'POST',
      })
      
      setSuccessMessage(`Demo account ready! Use phone: ${response.credentials.phone} or email: ${response.credentials.email}`)
      
      // Auto-fill the phone number
      setLoginMethod('phone')
      setCountryCode('+250')
      setPhoneNumber('700000000')
    } catch (err: any) {
      setError(err.message || 'Failed to create demo account')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    
    try {
      const response = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          phoneNumber,
          countryCode,
          loginMethod
        })
      })
      
      onLoginSuccess(response.userId, response.username, response.wallet)
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && (loginMethod === 'phone' ? phoneNumber : email)) {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
        <div className="flex flex-col items-center mb-8">
          <AlvesbettLogo size="lg" animated className="mb-2" />
          <p className="text-purple-300">Welcome Back</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-purple-200">Login Method</Label>
            <RadioGroup value={loginMethod} onValueChange={(v) => setLoginMethod(v as 'email' | 'phone')}>
              <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                <RadioGroupItem value="phone" id="login-phone" />
                <Label htmlFor="login-phone" className="text-white cursor-pointer flex-1">Phone Number</Label>
              </div>
              <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                <RadioGroupItem value="email" id="login-email" />
                <Label htmlFor="login-email" className="text-white cursor-pointer flex-1">Email</Label>
              </div>
            </RadioGroup>
          </div>

          {loginMethod === 'phone' ? (
            <div className="space-y-3">
              <Label className="text-purple-200">Phone Number</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-32 bg-purple-900/30 border-purple-500/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+250">🇷🇼 +250</SelectItem>
                    <SelectItem value="+254">🇰🇪 +254</SelectItem>
                    <SelectItem value="+255">🇹🇿 +255</SelectItem>
                    <SelectItem value="+256">🇺🇬 +256</SelectItem>
                    <SelectItem value="+257">🇧🇮 +257</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-purple-200">Email Address</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
              <p className="font-semibold mb-1">Login Error:</p>
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-200 text-sm">
              <p className="font-semibold mb-1">✓ Success!</p>
              <p>{successMessage}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || (loginMethod === 'phone' ? !phoneNumber : !email)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black/60 px-2 text-purple-400">Testing</span>
            </div>
          </div>

          <Button
            onClick={handleCreateDemoAccount}
            disabled={loading}
            variant="outline"
            className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
          >
            Create Demo Account (5000 FRW)
          </Button>

          <div className="text-center">
            <button
              onClick={onSwitchToSignup}
              className="text-purple-300 hover:text-purple-100 underline"
            >
              Don't have an account? Sign Up & Get 1000 FRW Bonus!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
