import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { 
  signInWithGoogle,
  signInWithGitHub,
  signOut as authSignOut
} from '../lib/auth'
import { AuthState, AuthResponse } from '../types/auth'
import { analytics } from '../lib/analytics'

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<AuthResponse>
  signInWithGitHub: () => Promise<AuthResponse>
  signOut: () => Promise<AuthResponse>
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
  const [profile] = useState(null)
  const [loading, setLoading] = useState(true)

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
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignInWithGoogle = async (): Promise<AuthResponse> => {
    const response = await signInWithGoogle()
    analytics.signUp('google')
    return response
  }

  const handleSignInWithGitHub = async (): Promise<AuthResponse> => {
    const response = await signInWithGitHub()
    analytics.signUp('github')
    return response
  }

  const signOut = async (): Promise<AuthResponse> => {
    const response = await authSignOut()
    return response
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGitHub: handleSignInWithGitHub,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}