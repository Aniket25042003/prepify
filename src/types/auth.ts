/**
 * Authentication-related type definitions
 * Provides type safety for auth operations and user data
 */

import { User, Session, AuthError } from '@supabase/supabase-js'

// Extended user profile interface
export interface UserProfile {
  id: string
  email: string
  email_verified: boolean
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Authentication state interface
export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
}

// Authentication response interfaces
export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
}

// Auth error types for better error handling
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'network_error'
  | 'unknown_error'

export interface CustomAuthError {
  type: AuthErrorType
  message: string
  originalError?: AuthError
}