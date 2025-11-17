import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

// Profile type
interface Profile {
  id: string
  userId: string
  fullName: string
  email: string
  country: string
  phone: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string, country?: string, phone?: string) => Promise<{ success: boolean; message?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean }>
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  // Initialize auth state
  useEffect(() => {
    console.log('🔄 Initializing Supabase auth...')

    // Handle email confirmation callback if present in URL
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (error) {
        console.error('❌ Auth callback error:', error, errorDescription)
        // Clean up URL even on error
        window.history.replaceState({}, document.title, window.location.pathname)
        setLoading(false)
        return
      }

      if (code) {
        console.log('🔄 Processing auth callback with code...')
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('❌ Auth callback error:', error)
            // Clean up URL even on error
            window.history.replaceState({}, document.title, window.location.pathname)
            setLoading(false)
            return
          } else if (data.session) {
            console.log('✅ Auth callback successful, session established')
            setSession(data.session)
            setUser(data.session.user)
            await loadProfile(data.session.user.id, data.session.access_token)
            // Clean up URL - remove all query parameters
            window.history.replaceState({}, document.title, window.location.pathname)
            console.log('🧹 URL cleaned up, removed code parameter')
            return
          }
        } catch (err) {
          console.error('❌ Auth callback failed:', err)
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname)
          setLoading(false)
          return
        }
      }

      // Get initial session if no callback
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          loadProfile(session.user.id, session.access_token)
        } else {
          setLoading(false)
        }
      })
    }

    handleAuthCallback()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        loadProfile(session.user.id, session.access_token)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string, accessToken: string) => {
    try {
      console.log('🔄 Loading profile for user:', userId)
      
      // Try to get profile from database
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.warn('⚠️ Profile fetch error:', fetchError)
        
        // If profile doesn't exist, try to create it
        if (fetchError.code === 'PGRST116') {
          console.log('🔄 Profile not found, creating one...')
          const { data: userData } = await supabase.auth.getUser()
          
          if (userData?.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                email: userData.user.email || '',
                full_name: userData.user.user_metadata?.full_name || '',
                country: userData.user.user_metadata?.country || '',
                phone: userData.user.user_metadata?.phone || ''
              })
              .select()
              .single()

            if (createError) {
              console.error('❌ Failed to create profile:', createError)
            } else if (newProfile) {
              const mappedProfile: Profile = {
                id: newProfile.id,
                userId: newProfile.user_id,
                fullName: newProfile.full_name || '',
                email: newProfile.email,
                country: newProfile.country || '',
                phone: newProfile.phone || '',
                created_at: newProfile.created_at,
                updated_at: newProfile.updated_at
              }
              setProfile(mappedProfile)
              console.log('✅ Profile created and loaded successfully')
            }
          }
        }
      } else if (profileData) {
        // Map database fields to Profile type
        const mappedProfile: Profile = {
          id: profileData.id,
          userId: profileData.user_id,
          fullName: profileData.full_name || '',
          email: profileData.email,
          country: profileData.country || '',
          phone: profileData.phone || '',
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        }
        setProfile(mappedProfile)
        console.log('✅ Profile loaded successfully')
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, country?: string, phone?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('🔄 Starting registration for:', email)

      // Get the correct redirect URL
      const redirectTo = import.meta.env.VITE_SITE_URL || 'https://devtrackafrica.vercel.app'

      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
            country: country || '',
            phone: phone || ''
          },
          emailRedirectTo: redirectTo
        }
      })

      if (signUpError) {
        console.error('❌ Supabase signup error:', signUpError)
        return { success: false, message: signUpError.message }
      }

      if (!authData.user) {
        return { success: false, message: 'Failed to create user account' }
      }

      console.log('✅ User created in auth:', authData.user.id)

      // Step 2: Create profile in database
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: email,
            full_name: fullName || '',
            country: country || '',
            phone: phone || ''
          })

        if (profileError) {
          console.warn('⚠️ Profile creation error (non-critical):', profileError)
          // Don't fail registration if profile creation fails
          // The profile can be created later
        } else {
          console.log('✅ Profile created successfully')
        }
      } catch (profileErr) {
        console.warn('⚠️ Profile creation failed (non-critical):', profileErr)
      }

      // Step 3: Check if email confirmation is required
      if (authData.session) {
        // User is logged in immediately (email confirmation disabled)
        setSession(authData.session)
        setUser(authData.user)
        await loadProfile(authData.user.id, authData.session.access_token)
        console.log('✅ User registered and signed in successfully')
        return { success: true, message: 'Account created successfully!' }
      } else {
        // Email confirmation required
        console.log('📧 Email confirmation required')
        return { 
          success: true, 
          message: 'Account created! Please check your email to confirm your account.' 
        }
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error)
      return { success: false, message: error.message || 'Failed to create account. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { success: false, message: error.message }
      }

      if (data.session) {
        setSession(data.session)
        setUser(data.user)
        await loadProfile(data.user.id, data.session.access_token)
        console.log('✅ User signed in successfully:', email)
        return { success: true, message: 'Signed in successfully!' }
      }

      return { success: false, message: 'Failed to sign in' }
    } catch (error: any) {
      console.error('❌ Sign in error:', error)
      return { success: false, message: error.message || 'Failed to sign in' }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      setSession(null)
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean }> => {
    try {
      if (!user) {
        return { success: false }
      }

      console.log('🔄 Updating profile for user:', user.id)

      // Map Profile fields to database fields
      const dbUpdates: any = {}
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
      if (updates.country !== undefined) dbUpdates.country = updates.country
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone

      // Update profile in database
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Profile update error:', error)
        return { success: false }
      }

      if (!updatedProfile) {
        return { success: false }
      }
      
      // Map database fields back to Profile type
      const mappedProfile: Profile = {
        id: updatedProfile.id,
        userId: updatedProfile.user_id,
        fullName: updatedProfile.full_name || '',
        email: updatedProfile.email,
        country: updatedProfile.country || '',
        phone: updatedProfile.phone || '',
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at
      }
      
      setProfile(mappedProfile)
      console.log('✅ Profile updated successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      return { success: false }
    }
  }

  const resendConfirmation = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      console.log('📧 Resending confirmation email to:', email)

      // Get the correct redirect URL
      const redirectTo = import.meta.env.VITE_SITE_URL || 'https://devtrackafrica.vercel.app'

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectTo
        }
      })

      if (error) {
        console.error('❌ Error resending confirmation email:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Confirmation email sent successfully')
      return { success: true, message: 'Confirmation email sent! Please check your inbox.' }
    } catch (error: any) {
      console.error('❌ Error resending confirmation email:', error)
      return { success: false, error: error?.message || 'Failed to resend confirmation email' }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resendConfirmation
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

export type { Profile }
