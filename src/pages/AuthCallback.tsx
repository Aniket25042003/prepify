/**
 * Auth Callback Page
 * Handles Google and GitHub OAuth callback from Supabase
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StarBorder } from '../components/ui/star-border'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // Also check search params
        const searchError = searchParams.get('error')
        const searchCode = searchParams.get('code')

        // Handle OAuth errors first
        if (error || searchError) {
          const errorMsg = errorDescription || error || searchError || 'OAuth authentication failed'
          throw new Error(errorMsg)
        }

        // Handle OAuth code flow (newer Supabase versions)
        if (searchCode && !accessToken) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(searchCode)
          
          if (exchangeError) {
            throw exchangeError
          }

          if (data.user) {
            setStatus('success')
            setMessage('Sign-in successful! Redirecting to dashboard...')
            
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
            return
          }
        }

        // Handle direct token flow (legacy)
        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            throw sessionError
          }

          if (data.user) {
            setStatus('success')
            setMessage('Sign-in successful! Redirecting to dashboard...')
            
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
            return
          } else {
            throw new Error('No user data received from session')
          }
        }

        // If we get here, no valid tokens or code were found
        throw new Error('No valid authentication data found. Please try signing in again.')

      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Authentication failed')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

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
            {status === 'success' ? 'Sign-in Successful!' : status === 'loading' ? 'Processing Sign-in...' : 'Authentication Error'}
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
                Redirecting to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}