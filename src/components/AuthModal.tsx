import React, { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { StarBorder } from './ui/star-border'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await signInWithGoogle()
      
      if (response.success) {
        setSuccess(response.message || 'Redirecting to Google...')
        // The OAuth flow will handle the redirect
      } else {
        setError(response.error || 'Failed to sign in with Google')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create floating particles for the modal
  const particles = Array.from({ length: 20 }, (_, i) => (
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
    <div className="modal-overlay bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
      {/* Background Particles */}
      <div className="particles">
        {particles}
      </div>
      
      <div className="relative z-10 glass-strong rounded-2xl p-8 w-full max-w-md border border-purple-500/30 card-3d animate-scale-in bg-slate-900/95 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors interactive"
          title="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Message */}
        {success && (
          <div className="glass rounded-lg p-3 mb-6 border border-green-500/30 animate-fade-in bg-green-500/10">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass rounded-lg p-3 mb-6 border border-red-500/30 animate-fade-in bg-red-500/10">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
            Welcome to AI Interview Prep
          </h2>
          <p className="text-slate-400">
            Sign in with Google to start practicing interviews
          </p>
        </div>

        <div className="space-y-4">
          <StarBorder
            as="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full disabled:opacity-50"
          >
            <div className="flex items-center justify-center space-x-3 px-4">
              {loading ? (
                <div className="spinner-3d"></div>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </div>
          </StarBorder>

          <div className="text-center text-sm text-slate-400">
            <p>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}