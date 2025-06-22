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
  emailVerificationSent: boolean
}

// Authentication form data interfaces
export interface SignUpFormData {
  email: string
  password: string
  fullName?: string
}

export interface SignInFormData {
  email: string
  password: string
}

// Authentication response interfaces
export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  requiresVerification?: boolean
}

// Password validation interface
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

// Email verification status
export interface EmailVerificationStatus {
  isVerified: boolean
  verificationSent: boolean
  canResend: boolean
  nextResendTime?: Date
}

// Auth error types for better error handling
export type AuthErrorType = 
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'weak_password'
  | 'email_already_exists'
  | 'invalid_email'
  | 'network_error'
  | 'unknown_error'

export interface CustomAuthError {
  type: AuthErrorType
  message: string
  originalError?: AuthError
}