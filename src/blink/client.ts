import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-fashion-shopper-india-k036y4st',
  authRequired: true
})

// API configuration for external services
export const API_BASE_URL = 'https://api.example.com' // This will be replaced with proper Blink SDK calls
export const DUMMY_USER_ID = 'user_123' // This will be replaced with actual user from Blink auth