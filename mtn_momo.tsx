// MTN Mobile Money API Integration
// Documentation: https://momodeveloper.mtn.com/

interface MTNMoMoConfig {
  environment: 'sandbox' | 'production'
  subscriptionKey: string
  apiUser: string
  apiKey: string
  collectionPrimaryKey: string
  disbursementPrimaryKey: string
  targetEnvironment: string
  callbackUrl: string
}

// Get MTN MoMo configuration from environment variables
export function getMTNConfig(): MTNMoMoConfig {
  return {
    environment: (Deno.env.get('MTN_ENVIRONMENT') || 'sandbox') as 'sandbox' | 'production',
    subscriptionKey: Deno.env.get('MTN_SUBSCRIPTION_KEY') || '',
    apiUser: Deno.env.get('MTN_API_USER') || '',
    apiKey: Deno.env.get('MTN_API_KEY') || '',
    collectionPrimaryKey: Deno.env.get('MTN_COLLECTION_PRIMARY_KEY') || '',
    disbursementPrimaryKey: Deno.env.get('MTN_DISBURSEMENT_PRIMARY_KEY') || '',
    targetEnvironment: Deno.env.get('MTN_TARGET_ENVIRONMENT') || 'sandbox',
    callbackUrl: Deno.env.get('MTN_CALLBACK_URL') || ''
  }
}

// Get base URL based on environment
function getBaseURL(environment: string): string {
  if (environment === 'production') {
    return 'https://proxy.momoapi.mtn.com'
  }
  return 'https://sandbox.momodeveloper.mtn.com'
}

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Create OAuth2 token for Collections
export async function createCollectionToken(config: MTNMoMoConfig): Promise<string> {
  const baseURL = getBaseURL(config.environment)
  
  const response = await fetch(`${baseURL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': config.collectionPrimaryKey,
      'Authorization': `Basic ${btoa(`${config.apiUser}:${config.apiKey}`)}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create collection token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Create OAuth2 token for Disbursements
export async function createDisbursementToken(config: MTNMoMoConfig): Promise<string> {
  const baseURL = getBaseURL(config.environment)
  
  const response = await fetch(`${baseURL}/disbursement/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': config.disbursementPrimaryKey,
      'Authorization': `Basic ${btoa(`${config.apiUser}:${config.apiKey}`)}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create disbursement token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Request payment from user (Collection)
export async function requestToPay(
  config: MTNMoMoConfig,
  amount: number,
  phoneNumber: string,
  externalId: string,
  payerMessage: string = 'Payment for ALVESBETT deposit',
  payeeNote: string = 'ALVESBETT Deposit'
): Promise<string> {
  const baseURL = getBaseURL(config.environment)
  const token = await createCollectionToken(config)
  const referenceId = generateUUID()

  // Remove country code if present and format
  const cleanPhone = phoneNumber.replace(/^\+?250/, '').replace(/\s/g, '')

  const response = await fetch(`${baseURL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.collectionPrimaryKey,
      'X-Callback-Url': config.callbackUrl
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'RWF',
      externalId: externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone
      },
      payerMessage: payerMessage,
      payeeNote: payeeNote
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to request payment: ${error}`)
  }

  return referenceId
}

// Check payment status
export async function getTransactionStatus(
  config: MTNMoMoConfig,
  referenceId: string
): Promise<any> {
  const baseURL = getBaseURL(config.environment)
  const token = await createCollectionToken(config)

  const response = await fetch(`${baseURL}/collection/v1_0/requesttopay/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.collectionPrimaryKey
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get transaction status: ${error}`)
  }

  return await response.json()
}

// Transfer money to user (Disbursement)
export async function transfer(
  config: MTNMoMoConfig,
  amount: number,
  phoneNumber: string,
  externalId: string,
  payeeNote: string = 'ALVESBETT Withdrawal'
): Promise<string> {
  const baseURL = getBaseURL(config.environment)
  const token = await createDisbursementToken(config)
  const referenceId = generateUUID()

  // Remove country code if present and format
  const cleanPhone = phoneNumber.replace(/^\+?250/, '').replace(/\s/g, '')

  const response = await fetch(`${baseURL}/disbursement/v1_0/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.disbursementPrimaryKey,
      'X-Callback-Url': config.callbackUrl
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'RWF',
      externalId: externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone
      },
      payerMessage: 'ALVESBETT Withdrawal',
      payeeNote: payeeNote
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to transfer money: ${error}`)
  }

  return referenceId
}

// Check transfer status
export async function getTransferStatus(
  config: MTNMoMoConfig,
  referenceId: string
): Promise<any> {
  const baseURL = getBaseURL(config.environment)
  const token = await createDisbursementToken(config)

  const response = await fetch(`${baseURL}/disbursement/v1_0/transfer/${referenceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.disbursementPrimaryKey
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get transfer status: ${error}`)
  }

  return await response.json()
}

// Get account balance
export async function getAccountBalance(config: MTNMoMoConfig): Promise<any> {
  const baseURL = getBaseURL(config.environment)
  const token = await createCollectionToken(config)

  const response = await fetch(`${baseURL}/collection/v1_0/account/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.collectionPrimaryKey
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get account balance: ${error}`)
  }

  return await response.json()
}
