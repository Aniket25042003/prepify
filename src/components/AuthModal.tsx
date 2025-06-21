import React, { useState } from 'react'
import { useEffect } from 'react'
import { X, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { StarBorder } from './ui/star-border'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  if (!isOpen) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setSuccess(true) // Show success message on sign up
      } else {
        await signInWithEmail(email, password)
        onClose()
      }
    } catch (err) {
      const error = err as Error
      setError(error.message || 'Authentication failed')
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

        {success ? (
          <div className="text-center animate-fade-in">
            <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
            <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
              Check Your Inbox
            </h2>
            <p className="text-slate-300 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>. Please click the link to complete your registration.
            </p>
            <StarBorder as="button" onClick={onClose}>
              Close
            </StarBorder>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
                {isSignUp ? 'Join the Journey' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400">
                {isSignUp ? 'Create your account to start practicing interviews' : 'Sign in to continue your interview preparation'}
              </p>
            </div>

            {error && (
              <div className="glass rounded-lg p-3 mb-6 border border-red-500/30 animate-fade-in bg-red-500/10">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input w-full pl-10 pr-4 py-3 text-white placeholder-slate-400 rounded-lg interactive"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input w-full pl-10 pr-12 py-3 text-white placeholder-slate-400 rounded-lg interactive"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <StarBorder
                as="button"
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner-3d mx-auto"></div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </StarBorder>
            </form>

            <div className="text-center">
              <StarBorder
                as="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
                color="rgb(168, 85, 247)"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </StarBorder>
            </div>
          </>
        )}
      </div>
    </div>
  )
}