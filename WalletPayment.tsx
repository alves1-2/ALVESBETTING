import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { apiCall } from '../utils/api'
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface WalletPaymentProps {
  userId: string
  wallet: number
  onWalletUpdate: (newBalance: number) => void
}

export function WalletPayment({ userId, wallet, onWalletUpdate }: WalletPaymentProps) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'mtn' | 'airtel'>('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleDeposit = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const depositAmount = parseFloat(amount)
      const response = await apiCall('/deposit', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          amount: depositAmount,
          method,
          phoneNumber
        })
      })

      setMessage(response.message)
      onWalletUpdate(response.newBalance)
      setAmount('')
      setPhoneNumber('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const withdrawAmount = parseFloat(amount)
      const response = await apiCall('/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          amount: withdrawAmount,
          method,
          phoneNumber
        })
      })

      setMessage(response.message)
      onWalletUpdate(response.newBalance)
      setAmount('')
      setPhoneNumber('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg border-2 border-purple-500 p-6 text-center">
        <Wallet className="w-12 h-12 mx-auto mb-3 text-purple-400" />
        <p className="text-purple-300 mb-2">Current Balance</p>
        <p className="text-4xl text-white">{wallet.toFixed(0)} <span className="text-2xl text-purple-300">FRW</span></p>
      </div>

      <div className="bg-purple-900/20 rounded-lg border-2 border-purple-500/50 p-6 space-y-6">
        <div className="flex gap-3">
          <Button
            onClick={() => setMode('deposit')}
            className={`flex-1 ${mode === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-900/50'}`}
          >
            <ArrowDownCircle className="w-5 h-5 mr-2" />
            Deposit
          </Button>
          <Button
            onClick={() => setMode('withdraw')}
            className={`flex-1 ${mode === 'withdraw' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-900/50'}`}
          >
            <ArrowUpCircle className="w-5 h-5 mr-2" />
            Withdraw
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-purple-200">Payment Method</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as 'mtn' | 'airtel')}>
              <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                <RadioGroupItem value="mtn" id="mtn" />
                <Label htmlFor="mtn" className="text-white cursor-pointer flex-1">
                  📱 MTN Mobile Money
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                <RadioGroupItem value="airtel" id="airtel" />
                <Label htmlFor="airtel" className="text-white cursor-pointer flex-1">
                  📱 Airtel Money
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-200">Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+250XXXXXXXXX"
              className="bg-purple-900/30 border-purple-500/50 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-purple-200">
              Amount (FRW) {mode === 'withdraw' && <span className="text-sm">(Min: 3000)</span>}
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'deposit' ? 'Enter amount' : 'Min 3000 FRW'}
              className="bg-purple-900/30 border-purple-500/50 text-white"
            />
          </div>

          {mode === 'deposit' && amount && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-sm">
              <p className="text-yellow-200">
                Tax: {(parseFloat(amount) * 0.12).toFixed(0)} FRW (12%)
              </p>
              <p className="text-yellow-200">
                You will receive: {(parseFloat(amount) * 0.88).toFixed(0)} FRW
              </p>
              <p className="text-yellow-300 text-xs mt-2">
                Tax goes to: 0793758208
              </p>
            </div>
          )}

          {message && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-200 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={loading || !amount || !phoneNumber || (mode === 'withdraw' && parseFloat(amount) < 3000)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? 'Processing...' : mode === 'deposit' ? 'Deposit Money' : 'Withdraw Money'}
          </Button>

          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 text-sm text-blue-200">
            <p className="mb-2">📌 <strong>Important Information:</strong></p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>12% tax is deducted from all deposits</li>
              <li>Minimum withdrawal amount is 3000 FRW</li>
              <li>For support, WhatsApp: 0793758208</li>
              <li>This is a demo - MTN MoMo API integration requires official credentials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
