/**
 * Auth Callback Page
 * Handles email verification and password reset callbacks from Supabase
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StarBorder } from '../components/ui/star-border'

type CallbackType = 'email-verification' | 'password-reset' | 'unknown'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [callbackType, setCallbackType] = useState<CallbackType>('unknown')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        // Also check search params for type
        const searchType = searchParams.get('type')
        const finalType = type || searchType

        // Determine callback type
        if (finalType === 'signup' || finalType === 'email_confirmation') {
          setCallbackType('email-verification')
        } else if (finalType === 'recovery') {
          setCallbackType('password-reset')
        }

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            throw error
          }

          if (data.user) {
            if (callbackType === 'email-verification') {
              setStatus('success')
              setMessage('Email verified successfully! You can now access your account.')
              
              // Redirect to dashboard after a delay
              setTimeout(() => {
                navigate('/dashboard')
              }, 3000)
            } else if (callbackType === 'password-reset') {
              setStatus('success')
              setMessage('You can now set a new password.')
              
              // Redirect to a password reset form or dashboard
              setTimeout(() => {
                navigate('/dashboard') // You might want to create a password reset form page
              }, 2000)
            } else {
              setStatus('success')
              setMessage('Authentication successful!')
              
              setTimeout(() => {
                navigate('/dashboard')
              }, 2000)
            }
          } else {
            throw new Error('No user data received')
          }
        } else {
          // Handle cases where tokens are not present
          const error = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')
          
          if (error) {
            throw new Error(errorDescription || error)
          } else {
            throw new Error('Invalid callback parameters')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Authentication failed')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams, callbackType])

  const getTitle = () => {
    switch (callbackType) {
      case 'email-verification':
        return status === 'success' ? 'Email Verified!' : 'Verifying Email...'
      case 'password-reset':
        return status === 'success' ? 'Password Reset Ready' : 'Processing Reset...'
      default:
        return status === 'success' ? 'Authentication Successful' : 'Authenticating...'
    }
  }

  const getIcon = () => {
    if (status === 'loading') {
      return <Loader className="h-8 w-8 text-purple-400 animate-spin" />
    } else if (status === 'success') {
      return <CheckCircle className="h-8 w-8 text-green-400" />
    } else {
      return <AlertCircle className="h-8 w-8 text-red-400" />
    }
  }

  // Create floating particles
  const particles = Array.from({ length: 30 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  ))

  return (
    <div className="min-h-screen bg-professional text-white overflow-hidden relative flex items-center justify-center">
      {/* Animated Background Particles */}
      <div className="particles">
        {particles}
      </div>

      <div className="relative z-10 max-w-md mx-auto p-8">
        <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 text-center card-3d animate-scale-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold font-serif mb-4 text-gradient">
            {getTitle()}
          </h1>
          
          <p className="text-slate-300 mb-6">
            {status === 'loading' ? 'Please wait while we process your request...' : message}
          </p>

          {status === 'error' && (
            <div className="space-y-4">
              <StarBorder
                as="button"
                onClick={() => navigate('/')}
                className="w-full"
                color="rgb(168, 85, 247)"
              >
                Return to Home
              </StarBorder>
            </div>
          )}

          {status === 'success' && (
            <div className="glass rounded-lg p-4">
              <p className="text-slate-400 text-sm">
                {callbackType === 'email-verification' 
                  ? 'Redirecting to your dashboard...'
                  : 'Redirecting...'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}