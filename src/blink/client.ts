import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-fashion-shopper-india-k036y4st',
  authRequired: false
})

// API configuration for external services
export const API_BASE_URL = 'https://agent-service-2wpf.onrender.com'
export const DUMMY_USER_ID = 'user_123' // This will be replaced with actual user from Blink auth