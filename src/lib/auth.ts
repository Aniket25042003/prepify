/**
 * Authentication service with email verification
 * Handles secure user authentication using Supabase
 */

import { supabase } from './supabase'
import { 
  SignUpFormData, 
  SignInFormData, 
  AuthResponse, 
  PasswordValidation, 
  CustomAuthError,
  AuthErrorType,
  EmailVerificationStatus
} from '../types/auth'
import { AuthError } from '@supabase/supabase-js'

/**
 * Password validation utility
 * Ensures passwords meet security requirements
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Character variety checks
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number')
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character')
  }

  // Determine strength
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
  if (password.length >= 12 && criteriaCount >= 3) {
    strength = 'strong'
  } else if (password.length >= 8 && criteriaCount >= 2) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Email validation utility
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Convert Supabase auth errors to custom error types
 */
function mapAuthError(error: AuthError): CustomAuthError {
  let type: AuthErrorType = 'unknown_error'
  let message = error.message

  switch (error.message) {
    case 'Invalid login credentials':
      type = 'invalid_credentials'
      message = 'Invalid email or password. Please check your credentials and try again.'
      break
    case 'Email not confirmed':
      type = 'email_not_verified'
      message = 'Please verify your email address before signing in. Check your inbox for a verification link.'
      break
    case 'Password should be at least 6 characters':
      type = 'weak_password'
      message = 'Password is too weak. Please choose a stronger password.'
      break
    case 'User already registered':
      type = 'email_already_exists'
      message = 'An account with this email already exists. Please sign in instead.'
      break
    case 'Unable to validate email address: invalid format':
      type = 'invalid_email'
      message = 'Please enter a valid email address.'
      break
    default:
      if (error.message.includes('network')) {
        type = 'network_error'
        message = 'Network error. Please check your connection and try again.'
      }
  }

  return { type, message, originalError: error }
}

/**
 * Sign up a new user with email verification
 */
export async function signUpWithEmailVerification(formData: SignUpFormData): Promise<AuthResponse> {
  try {
    // Validate email format
    if (!validateEmail(formData.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      }
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors.join(' ')
      }
    }

    // Attempt to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.fullName?.trim() || '',
        }
      }
    })

    if (error) {
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }

    // Check if user needs to verify email
    if (data.user && !data.user.email_confirmed_at) {
      return {
        success: true,
        message: 'Account created successfully! Please check your email and click the verification link to complete your registration.',
        requiresVerification: true
      }
    }

    return {
      success: true,
      message: 'Account created and verified successfully!'
    }

  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Sign in user with email verification check
 */
export async function signInWithEmailVerification(formData: SignInFormData): Promise<AuthResponse> {
  try {
    // Validate email format
    if (!validateEmail(formData.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      }
    }

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email.toLowerCase().trim(),
      password: formData.password
    })

    if (error) {
      const customError = mapAuthError(error)
      
      // Special handling for unverified email
      if (customError.type === 'email_not_verified') {
        return {
          success: false,
          error: customError.message,
          requiresVerification: true
        }
      }

      return {
        success: false,
        error: customError.message
      }
    }

    // Double-check email verification status
    if (data.user && !data.user.email_confirmed_at) {
      // Sign out the user since they're not verified
      await supabase.auth.signOut()
      
      return {
        success: false,
        error: 'Please verify your email address before signing in. Check your inbox for a verification link.',
        requiresVerification: true
      }
    }

    return {
      success: true,
      message: 'Successfully signed in!'
    }

  } catch (error) {
    console.error('Signin error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      }
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }

    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    }

  } catch (error) {
    console.error('Resend verification error:', error)
    return {
      success: false,
      error: 'Failed to resend verification email. Please try again.'
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.'
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${window.location.origin}/auth/reset-password`
      }
    )

    if (error) {
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }

    return {
      success: true,
      message: 'Password reset email sent! Please check your inbox.'
    }

  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Failed to send password reset email. Please try again.'
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors.join(' ')
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
      }
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    }

  } catch (error) {
    console.error('Password update error:', error)
    return {
      success: false,
      error: 'Failed to update password. Please try again.'
    }
  }
}

/**
 * Get email verification status
 */
export function getEmailVerificationStatus(user: any): EmailVerificationStatus {
  return {
    isVerified: !!user?.email_confirmed_at,
    verificationSent: false, // This would be tracked in component state
    canResend: true, // This would be based on rate limiting
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      const customError = mapAuthError(error)
      return {
        success: false,
        error: customError.message
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