import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-fashion-shopper-india-k036y4st',
  authRequired: false
})

// API configuration
export const API_BASE_URL = 'https://agent-service-2wpf.onrender.com'
export const DUMMY_USER_ID = 'user_12345'