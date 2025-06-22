import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { 
  signUpWithEmailVerification, 
  signInWithEmailVerification, 
  signOut as authSignOut,
  resendEmailVerification,
  sendPasswordReset,
  updatePassword
} from '../lib/auth'
import { AuthState, SignUpFormData, SignInFormData, AuthResponse } from '../types/auth'

interface AuthContextType extends AuthState {
  signUpWithEmail: (formData: SignUpFormData) => Promise<AuthResponse>
  signInWithEmail: (formData: SignInFormData) => Promise<AuthResponse>
  signOut: () => Promise<AuthResponse>
  resendVerification: (email: string) => Promise<AuthResponse>
  resetPassword: (email: string) => Promise<AuthResponse>
  changePassword: (newPassword: string) => Promise<AuthResponse>
  clearEmailVerificationSent: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email_confirmed_at)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Clear email verification flag on successful sign in
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setEmailVerificationSent(false)
      }

      // Handle email confirmation
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        // User might have just verified their email
        if (session?.user?.email_confirmed_at) {
          console.log('Email verified successfully')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUpWithEmail = async (formData: SignUpFormData): Promise<AuthResponse> => {
    const response = await signUpWithEmailVerification(formData)
    if (response.success && response.requiresVerification) {
      setEmailVerificationSent(true)
    }
    return response
  }

  const signInWithEmail = async (formData: SignInFormData): Promise<AuthResponse> => {
    const response = await signInWithEmailVerification(formData)
    if (response.requiresVerification) {
      setEmailVerificationSent(true)
    }
    return response
  }

  const signOut = async (): Promise<AuthResponse> => {
    const response = await authSignOut()
    if (response.success) {
      setEmailVerificationSent(false)
    }
    return response
  }

  const resendVerification = async (email: string): Promise<AuthResponse> => {
    const response = await resendEmailVerification(email)
    if (response.success) {
      setEmailVerificationSent(true)
    }
    return response
  }

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    return await sendPasswordReset(email)
  }

  const changePassword = async (newPassword: string): Promise<AuthResponse> => {
    return await updatePassword(newPassword)
  }

  const clearEmailVerificationSent = () => {
    setEmailVerificationSent(false)
  }

  const value = {
    user,
    session,
    profile,
    loading,
    emailVerificationSent,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    resendVerification,
    resetPassword,
    changePassword,
    clearEmailVerificationSent,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}