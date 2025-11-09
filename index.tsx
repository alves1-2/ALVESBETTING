import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Helper function to generate verification code (numbers + 2 letters)
function generateVerificationCode(): string {
  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  const letters = String.fromCharCode(97 + Math.floor(Math.random() * 26)) + 
                  String.fromCharCode(97 + Math.floor(Math.random() * 26))
  return numbers + letters
}

// Helper function to generate unique user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Sign up route
app.post('/make-server-81301e3a/signup', async (c) => {
  try {
    const { email, phoneNumber, countryCode, signupMethod } = await c.req.json()
    
    const verificationCode = generateVerificationCode()
    const userId = generateUserId()
    
    // Store temporary signup data
    const tempData = {
      userId,
      email: signupMethod === 'email' ? email : null,
      phoneNumber: signupMethod === 'phone' ? `${countryCode}${phoneNumber}` : null,
      verificationCode,
      verified: false,
      createdAt: Date.now(),
      signupMethod
    }
    
    await kv.set(`temp_signup:${userId}`, tempData)
    
    console.log(`Signup initiated for ${signupMethod}: ${email || phoneNumber}, code: ${verificationCode}`)
    
    return c.json({ 
      success: true, 
      userId,
      verificationCode, // In production, this would be sent via SMS/email
      message: 'Verification code generated'
    })
  } catch (error) {
    console.error('Error during signup:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Verify code and complete signup
app.post('/make-server-81301e3a/verify-signup', async (c) => {
  try {
    const { userId, code, username, avatar, robotAnswer } = await c.req.json()
    
    console.log(`Verifying signup - userId: ${userId}, code: ${code}, username: ${username}`)
    
    // Check robot verification
    if (robotAnswer.toLowerCase().trim() !== 'spider') {
      console.log('Robot verification failed:', robotAnswer)
      return c.json({ success: false, error: 'Robot verification failed. Answer should be "spider"' }, 400)
    }
    
    const tempData = await kv.get(`temp_signup:${userId}`)
    if (!tempData) {
      console.log('Signup session not found for userId:', userId)
      return c.json({ success: false, error: 'Signup session not found or expired' }, 404)
    }
    
    if (tempData.verificationCode !== code) {
      console.log(`Verification code mismatch. Expected: ${tempData.verificationCode}, Got: ${code}`)
      return c.json({ success: false, error: 'Invalid verification code' }, 400)
    }
    
    // Generate a unique user ID for our system
    const newUserId = generateUserId()
    
    // Create user profile with 1000 FRW bonus
    const userProfile = {
      userId: newUserId,
      username,
      avatar,
      email: tempData.email,
      phoneNumber: tempData.phoneNumber,
      wallet: 1000, // Initial bonus
      totalDeposited: 0,
      totalWithdrawn: 0,
      instagramBonusClaimed: false,
      createdAt: Date.now(),
      verified: true,
      signupMethod: tempData.signupMethod
    }
    
    await kv.set(`user:${newUserId}`, userProfile)
    await kv.del(`temp_signup:${userId}`)
    
    console.log(`User ${username} successfully created with ID: ${newUserId} and 1000 FRW bonus`)
    console.log('User profile saved:', JSON.stringify(userProfile))
    
    // Verify user was saved
    const savedUser = await kv.get(`user:${newUserId}`)
    console.log('Verification - user retrieved from DB:', savedUser ? 'Success' : 'Failed')
    
    return c.json({ 
      success: true, 
      userId: newUserId,
      username,
      wallet: 1000,
      message: 'Account created successfully with 1000 FRW bonus!'
    })
  } catch (error) {
    console.error('Error verifying signup:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Login route
app.post('/make-server-81301e3a/login', async (c) => {
  try {
    const { email, phoneNumber, countryCode, loginMethod } = await c.req.json()
    
    console.log(`Login attempt - Method: ${loginMethod}, Email: ${email}, Phone: ${countryCode}${phoneNumber}`)
    
    // Find user profile
    const users = await kv.getByPrefix('user:')
    console.log(`Found ${users.length} users in database`)
    
    // Debug: log first user structure if exists
    if (users.length > 0) {
      console.log('Sample user structure:', JSON.stringify(users[0]))
    }
    
    let userProfile
    if (loginMethod === 'phone') {
      const fullPhone = `${countryCode}${phoneNumber}`
      userProfile = users.find(u => u && u.phoneNumber === fullPhone)
      console.log(`Looking for phone: ${fullPhone}`)
      if (!userProfile && users.length > 0) {
        console.log('Available phone numbers:', users.map(u => u.phoneNumber).filter(Boolean))
      }
    } else {
      userProfile = users.find(u => u && u.email === email)
      console.log(`Looking for email: ${email}`)
      if (!userProfile && users.length > 0) {
        console.log('Available emails:', users.map(u => u.email).filter(Boolean))
      }
    }
    
    if (!userProfile) {
      console.log('User not found during login')
      if (users.length === 0) {
        return c.json({ success: false, error: 'No users registered yet. Please sign up first to get your 1000 FRW bonus!' }, 404)
      }
      return c.json({ success: false, error: 'User not found. Please check your credentials or sign up.' }, 404)
    }
    
    // For demo, generate a session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Login successful for user: ${userProfile.username}`)
    
    return c.json({ 
      success: true, 
      sessionToken,
      userId: userProfile.userId,
      username: userProfile.username,
      wallet: userProfile.wallet
    })
  } catch (error) {
    console.error('Error during login:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get user profile
app.get('/make-server-81301e3a/profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const userProfile = await kv.get(`user:${userId}`)
    
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    return c.json({ success: true, profile: userProfile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Deposit money (MTN/Airtel integration)
app.post('/make-server-81301e3a/deposit', async (c) => {
  try {
    const { userId, amount, method, phoneNumber } = await c.req.json()
    
    // In production, integrate with MTN Mobile Money API
    // This is a mock implementation
    
    const userProfile = await kv.get(`user:${userId}`)
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    // Calculate tax (12%)
    const tax = amount * 0.12
    const netAmount = amount - tax
    
    // Update wallet
    userProfile.wallet += netAmount
    userProfile.totalDeposited += amount
    
    await kv.set(`user:${userId}`, userProfile)
    
    // Save transaction history
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const transaction = {
      transactionId,
      userId,
      type: 'deposit',
      method,
      amount,
      tax,
      netAmount,
      phoneNumber,
      timestamp: Date.now()
    }
    
    await kv.set(`transaction:${transactionId}`, transaction)
    
    console.log(`Deposit processed: ${amount} FRW (net: ${netAmount} FRW after 12% tax) for user ${userId}`)
    
    return c.json({ 
      success: true, 
      newBalance: userProfile.wallet,
      tax,
      netAmount,
      message: `Deposited ${netAmount} FRW (${tax} FRW tax deducted)`
    })
  } catch (error) {
    console.error('Error processing deposit:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Withdraw money
app.post('/make-server-81301e3a/withdraw', async (c) => {
  try {
    const { userId, amount, method, phoneNumber } = await c.req.json()
    
    const userProfile = await kv.get(`user:${userId}`)
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    // Check minimum withdrawal
    if (amount < 3000) {
      return c.json({ success: false, error: 'Minimum withdrawal is 3000 FRW' }, 400)
    }
    
    // Check sufficient balance
    if (userProfile.wallet < amount) {
      return c.json({ success: false, error: 'Insufficient balance' }, 400)
    }
    
    // Update wallet
    userProfile.wallet -= amount
    userProfile.totalWithdrawn += amount
    
    await kv.set(`user:${userId}`, userProfile)
    
    // Save transaction history
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const transaction = {
      transactionId,
      userId,
      type: 'withdrawal',
      method,
      amount,
      phoneNumber,
      timestamp: Date.now()
    }
    
    await kv.set(`transaction:${transactionId}`, transaction)
    
    console.log(`Withdrawal processed: ${amount} FRW for user ${userId}`)
    
    return c.json({ 
      success: true, 
      newBalance: userProfile.wallet,
      message: `Withdrawn ${amount} FRW successfully`
    })
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Claim Instagram bonus
app.post('/make-server-81301e3a/claim-instagram-bonus', async (c) => {
  try {
    const { userId } = await c.req.json()
    
    const userProfile = await kv.get(`user:${userId}`)
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    if (userProfile.instagramBonusClaimed) {
      return c.json({ success: false, error: 'Instagram bonus already claimed' }, 400)
    }
    
    userProfile.wallet += 1000
    userProfile.instagramBonusClaimed = true
    
    await kv.set(`user:${userId}`, userProfile)
    
    return c.json({ 
      success: true, 
      newBalance: userProfile.wallet,
      message: 'Instagram bonus claimed: 1000 FRW'
    })
  } catch (error) {
    console.error('Error claiming Instagram bonus:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Like video bonus
app.post('/make-server-81301e3a/like-video-bonus', async (c) => {
  try {
    const { userId } = await c.req.json()
    
    const userProfile = await kv.get(`user:${userId}`)
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    userProfile.wallet += 50
    
    await kv.set(`user:${userId}`, userProfile)
    
    return c.json({ 
      success: true, 
      newBalance: userProfile.wallet,
      message: '50 FRW bonus added for liking video'
    })
  } catch (error) {
    console.error('Error processing like bonus:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Place bet
app.post('/make-server-81301e3a/place-bet', async (c) => {
  try {
    const { userId, gameType, betAmount, betDetails } = await c.req.json()
    
    const userProfile = await kv.get(`user:${userId}`)
    if (!userProfile) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    if (userProfile.wallet < betAmount) {
      return c.json({ success: false, error: 'Insufficient balance' }, 400)
    }
    
    // Deduct bet amount
    userProfile.wallet -= betAmount
    await kv.set(`user:${userId}`, userProfile)
    
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const bet = {
      betId,
      userId,
      gameType,
      betAmount,
      betDetails,
      status: 'pending',
      timestamp: Date.now()
    }
    
    await kv.set(`bet:${betId}`, bet)
    
    return c.json({ 
      success: true, 
      betId,
      newBalance: userProfile.wallet
    })
  } catch (error) {
    console.error('Error placing bet:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Settle bet (win/loss)
app.post('/make-server-81301e3a/settle-bet', async (c) => {
  try {
    const { userId, betId, won, winAmount } = await c.req.json()
    
    const userProfile = await kv.get(`user:${userId}`)
    const bet = await kv.get(`bet:${betId}`)
    
    if (!userProfile || !bet) {
      return c.json({ success: false, error: 'Bet or user not found' }, 404)
    }
    
    bet.status = won ? 'won' : 'lost'
    bet.winAmount = won ? winAmount : 0
    bet.settledAt = Date.now()
    
    if (won) {
      userProfile.wallet += winAmount
    }
    
    await kv.set(`user:${userId}`, userProfile)
    await kv.set(`bet:${betId}`, bet)
    
    // Save to game history
    const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await kv.set(`history:${userId}:${historyId}`, bet)
    
    return c.json({ 
      success: true, 
      won,
      winAmount,
      newBalance: userProfile.wallet
    })
  } catch (error) {
    console.error('Error settling bet:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get game history
app.get('/make-server-81301e3a/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const history = await kv.getByPrefix(`history:${userId}:`)
    
    // Sort by timestamp descending
    const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp)
    
    return c.json({ success: true, history: sortedHistory })
  } catch (error) {
    console.error('Error fetching history:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Create demo user for testing (development only)
app.post('/make-server-81301e3a/create-demo-user', async (c) => {
  try {
    const demoUserId = 'user_demo_12345'
    
    // Check if demo user already exists
    const existingUser = await kv.get(`user:${demoUserId}`)
    if (existingUser) {
      return c.json({ 
        success: true, 
        message: 'Demo user already exists',
        userId: demoUserId,
        username: existingUser.username,
        wallet: existingUser.wallet,
        credentials: {
          phone: '+250700000000',
          email: 'demo@alvesbett.com'
        }
      })
    }
    
    // Create demo user
    const demoUser = {
      userId: demoUserId,
      username: 'DemoPlayer123',
      avatar: 'male',
      email: 'demo@alvesbett.com',
      phoneNumber: '+250700000000',
      wallet: 5000,
      totalDeposited: 0,
      totalWithdrawn: 0,
      instagramBonusClaimed: false,
      createdAt: Date.now(),
      verified: true,
      signupMethod: 'phone'
    }
    
    await kv.set(`user:${demoUserId}`, demoUser)
    
    console.log('Demo user created:', demoUser)
    
    return c.json({ 
      success: true, 
      message: 'Demo user created successfully!',
      userId: demoUserId,
      username: demoUser.username,
      wallet: demoUser.wallet,
      credentials: {
        phone: '+250700000000',
        email: 'demo@alvesbett.com'
      }
    })
  } catch (error) {
    console.error('Error creating demo user:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// Get sports matches
app.get('/make-server-81301e3a/matches', async (c) => {
  try {
    // In production, fetch from external API
    // Mock data for demo
    const matches = [
      {
        id: 'match1',
        sport: 'football',
        team1: 'Manchester United',
        team2: 'Liverpool',
        odds1: 2.3,
        odds2: 1.8,
        oddsDraw: 3.2,
        startTime: Date.now() + 3600000
      },
      {
        id: 'match2',
        sport: 'basketball',
        team1: 'Lakers',
        team2: 'Warriors',
        odds1: 1.9,
        odds2: 2.1,
        startTime: Date.now() + 7200000
      },
      {
        id: 'match3',
        sport: 'volleyball',
        team1: 'Brazil',
        team2: 'USA',
        odds1: 2.5,
        odds2: 1.6,
        startTime: Date.now() + 10800000
      }
    ]
    
    return c.json({ success: true, matches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)
