/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const getSupabaseConfig = () => {
  // Use environment variables if available, otherwise fall back to cloud Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bxytbgpqpltujtoabmxa.supabase.co'
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eXRiZ3BxcGx0dWp0b2FibXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODQ5OTQsImV4cCI6MjA3Nzk2MDk5NH0.n2rxSXvWO5ksSe68WCAbBnWhZ63Rfy_P8AAKskWcXNA'
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'bxytbgpqpltujtoabmxa'

  return {
    url: supabaseUrl,
    anonKey: anonKey,
    projectId: projectId
  }
}

const config = getSupabaseConfig()

console.log('🔧 Initializing Supabase client...')
console.log('📍 Supabase URL:', config.url)
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
console.log('🔑 Using environment variables:', !!env.VITE_SUPABASE_PROJECT_ID)

// Create Supabase client with enhanced configuration
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use localStorage for session persistence (works offline)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Set session storage key
    storageKey: 'devtrack-auth-token',
    // Disable flow type for better compatibility
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'devtrack-africa-pwa'
    }
  }
})

// Export configuration
export const supabaseConfig = config

// Export for backward compatibility
export const supabaseClient = supabase
export default supabase

// Verify connection on initialization (non-blocking)
if (typeof window !== 'undefined') {
  supabase.auth.getSession()
    .then(({ data: { session }, error }) => {
      if (error) {
        console.warn('⚠️ Supabase session check failed:', error.message)
      } else if (session) {
        console.log('✅ Supabase session active:', session.user.email)
      } else {
        console.log('ℹ️ No active Supabase session')
      }
    })
    .catch(err => {
      console.warn('⚠️ Supabase initialization check failed:', err)
    })
}
