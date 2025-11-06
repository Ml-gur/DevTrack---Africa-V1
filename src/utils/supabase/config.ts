/**
 * Supabase Configuration
 * Centralized configuration for Supabase connection
 */

// Get configuration from environment variables
export const getSupabaseConfig = () => {
  // Safe access to import.meta.env
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
  
  const projectId = env.VITE_SUPABASE_PROJECT_ID || 'tfivuvjlvrfeofcpxzde'
  const anonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaXZ1dmpsdnJmZW9mY3B4emRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODE0NTgsImV4cCI6MjA3MTg1NzQ1OH0.C7lZYtGNvTM1KWCrJXXhHgdrbvPWTE5ORBIs4oP6b-g'
  const serverFunctionName = env.VITE_SERVER_FUNCTION_NAME || 'make-server-3e6b72d9'
  
  const supabaseUrl = env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`
  const serverUrl = `${supabaseUrl}/functions/v1/${serverFunctionName}`
  
  return {
    projectId,
    anonKey,
    supabaseUrl,
    serverUrl,
    serverFunctionName
  }
}

// Export static config
export const config = getSupabaseConfig()

// Export individual values for backward compatibility
export const projectId = config.projectId
export const publicAnonKey = config.anonKey
export const supabaseUrl = config.supabaseUrl
export const serverUrl = config.serverUrl

// Feature flags
const getFeatures = () => {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
  return {
    offlineMode: env.VITE_ENABLE_OFFLINE !== 'false',
    pwa: env.VITE_ENABLE_PWA !== 'false',
    analytics: env.VITE_ENABLE_ANALYTICS !== 'false'
  }
}

export const features = getFeatures()

// App metadata
const getAppMetadata = () => {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
  return {
    name: env.VITE_APP_NAME || 'DevTrack Africa',
    version: env.VITE_APP_VERSION || '1.0.0',
    cacheVersion: env.VITE_CACHE_VERSION || '1'
  }
}

export const appMetadata = getAppMetadata()

// Validate configuration
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!config.projectId || config.projectId === 'your_project_id_here') {
    errors.push('VITE_SUPABASE_PROJECT_ID is not configured')
  }
  
  if (!config.anonKey || config.anonKey === 'your_anon_key_here') {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured')
  }
  
  if (!config.supabaseUrl.includes('supabase.co')) {
    errors.push('Invalid Supabase URL format')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Log configuration (safe for production - no sensitive data)
if (typeof window !== 'undefined') {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
  if (env.DEV) {
    console.log('🔧 Supabase Configuration:')
    console.log('  Project ID:', config.projectId)
    console.log('  Supabase URL:', config.supabaseUrl)
    console.log('  Server URL:', config.serverUrl)
    console.log('  Using env vars:', !!env.VITE_SUPABASE_PROJECT_ID)
    console.log('  Features:', features)
    
    const validation = validateConfig()
    if (!validation.valid) {
      console.warn('⚠️ Configuration warnings:', validation.errors)
    }
  }
}

export default config
