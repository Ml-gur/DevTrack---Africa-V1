import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const getSupabaseConfig = () => {
  // Safe access to import.meta.env
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

  // Use local development credentials if available, otherwise fall back to environment variables
  const supabaseUrl = env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
  const anonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
  const projectId = env.VITE_SUPABASE_PROJECT_ID || 'local-dev'

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
