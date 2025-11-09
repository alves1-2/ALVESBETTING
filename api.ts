import { projectId, publicAnonKey } from './supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-81301e3a`

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error(`API Error on ${endpoint}:`, data)
    throw new Error(data.error || 'API request failed')
  }
  
  return data
}
