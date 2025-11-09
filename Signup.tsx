import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { apiCall } from '../../utils/api'
import { AlvesbettLogo } from '../AlvesbettLogo'

interface SignupProps {
  onSignupSuccess: (userId: string, username: string, wallet: number) => void
  onBackToLogin: () => void
}

export function Signup({ onSignupSuccess, onBackToLogin }: SignupProps) {
  const [step, setStep] = useState<'method' | 'verify' | 'profile'>('method')
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('phone')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+250')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userId, setUserId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [userEnteredCode, setUserEnteredCode] = useState('')
  const [robotAnswer, setRobotAnswer] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<'male' | 'female' | 'oldmale' | 'oldfemale'>('male')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInitiateSignup = async () => {
    setError('')
    
    // Validation
    if (signupMethod === 'phone' && phoneNumber.length < 9) {
      setError('Please enter a valid phone number')
      return
    }
    if (signupMethod === 'email' && !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await apiCall('/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          phoneNumber,
          countryCode,
          signupMethod
        })
      })
      
      setUserId(response.userId)
      setVerificationCode(response.verificationCode)
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndComplete = async () => {
    setError('')
    
    // Validation
    if (!username || !/\d/.test(username)) {
      setError('Username must contain at least one number')
      return
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await apiCall('/verify-signup', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          code: userEnteredCode,
          username,
          avatar,
          robotAnswer
        })
      })
      
      onSignupSuccess(response.userId, response.username, response.wallet)
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const avatarImages = {
    male: '👨',
    female: '👩',
    oldmale: '👴',
    oldfemale: '👵'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
        <div className="flex flex-col items-center mb-8">
          <AlvesbettLogo size="lg" animated className="mb-2" />
          <p className="text-purple-300">Create Your Account</p>
        </div>

        {step === 'method' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-purple-200">Sign Up Method</Label>
              <RadioGroup value={signupMethod} onValueChange={(v) => setSignupMethod(v as 'email' | 'phone')}>
                <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                  <RadioGroupItem value="phone" id="phone" />
                  <Label htmlFor="phone" className="text-white cursor-pointer flex-1">Phone Number</Label>
                </div>
                <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-white cursor-pointer flex-1">Email (Optional)</Label>
                </div>
              </RadioGroup>
            </div>

            {signupMethod === 'phone' ? (
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
                  className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleInitiateSignup}
              disabled={loading || (signupMethod === 'phone' ? !phoneNumber : !email)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>

            <Button
              onClick={onBackToLogin}
              variant="ghost"
              className="w-full text-purple-300 hover:text-purple-100"
            >
              Back to Login
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30">
              <p className="text-purple-200 text-sm mb-2">Verification Code Sent:</p>
              <p className="text-2xl text-center text-white tracking-widest">{verificationCode}</p>
              <p className="text-purple-300 text-xs mt-2 text-center">(In production, this would be sent via SMS/Email)</p>
            </div>

            <div className="space-y-3">
              <Label className="text-purple-200">Enter Verification Code</Label>
              <Input
                type="text"
                placeholder="e.g., 07rx"
                value={userEnteredCode}
                onChange={(e) => setUserEnteredCode(e.target.value)}
                className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300 text-center tracking-widest"
                maxLength={4}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-purple-200">Robot Verification</Label>
              <p className="text-sm text-purple-300">Which animal has eight legs and hair?</p>
              <Input
                type="text"
                placeholder="Your answer..."
                value={robotAnswer}
                onChange={(e) => setRobotAnswer(e.target.value)}
                className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={() => {
                if (userEnteredCode === verificationCode && robotAnswer.toLowerCase().trim() === 'spider') {
                  setStep('profile')
                  setError('')
                } else {
                  setError('Invalid verification code or robot answer')
                }
              }}
              disabled={!userEnteredCode || !robotAnswer}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Verify & Continue
            </Button>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-purple-200">Choose Username (must include at least 1 number)</Label>
              <Input
                type="text"
                placeholder="e.g., player123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
              />
              {username && !/\d/.test(username) && (
                <p className="text-yellow-400 text-sm">Username must contain at least one number</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-purple-200">Choose Avatar</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(avatarImages) as Array<keyof typeof avatarImages>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setAvatar(key)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      avatar === key
                        ? 'border-purple-500 bg-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-5xl mb-2">{avatarImages[key]}</div>
                    <div className="text-white text-sm capitalize">{key.replace('old', 'Old ')}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleVerifyAndComplete}
              disabled={loading || !username || !/\d/.test(username)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'Creating Account...' : 'Create Account & Get 1000 FRW Bonus!'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
