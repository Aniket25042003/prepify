/**
 * OAuth Authentication service
 * Handles secure user authentication using Supabase and Google/GitHub OAuth
 */

import { supabase } from './supabase'
import { AuthResponse } from '../types/auth'
import { AuthError } from '@supabase/supabase-js'

/**
 * Convert Supabase auth errors to custom error types
 */
function mapAuthError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Authentication failed. Please try again.'
    case 'Email not confirmed':
      return 'Please verify your email address before signing in.'
    case 'User already registered':
      return 'An account with this email already exists.'
    default:
      if (error.message.includes('network')) {
        return 'Network error. Please check your connection and try again.'
      }
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://kcijmwltuoztxjuwcjqc.supabase.co/auth/v1/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error)
      }
    }

    // OAuth redirect will handle the actual sign-in
    return {
      success: true,
      message: 'Redirecting to Google...'
    }

  } catch (error) {
    console.error('Google sign-in error:', error)
    return {
      success: false,
      error: 'Failed to initiate Google sign-in. Please try again.'
    }
  }
}

/**
 * Sign in with GitHub OAuth
 */
export async function signInWithGitHub(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `https://kcijmwltuoztxjuwcjqc.supabase.co/auth/v1/callback`
      }
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error)
      }
    }

    // OAuth redirect will handle the actual sign-in
    return {
      success: true,
      message: 'Redirecting to GitHub...'
    }

  } catch (error) {
    console.error('GitHub sign-in error:', error)
    return {
      success: false,
      error: 'Failed to initiate GitHub sign-in. Please try again.'
    }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: mapAuthError(error)
      }
    }

    return {
      success: true,
      message: 'Successfully signed out!'
    }

  } catch (error) {
    console.error('Signout error:', error)
    return {
      success: false,
      error: 'Failed to sign out. Please try again.'
    }
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}