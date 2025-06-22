import React, { useState } from 'react'
import { useEffect } from 'react'
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { StarBorder } from './ui/star-border'
import { validatePassword } from '../lib/auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'email-verification'

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { 
    signUpWithEmail, 
    signInWithEmail, 
    resetPassword, 
    resendVerification,
    emailVerificationSent,
    clearEmailVerificationSent
  } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

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
      setEmail('')
      setPassword('')
      setFullName('')
      setMode('signin')
      clearEmailVerificationSent()
    }
  }, [isOpen, clearEmailVerificationSent])

  // Check password strength in real-time
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordStrength(validation.strength)
    }
  }, [password])

  // Switch to email verification mode if needed
  useEffect(() => {
    if (emailVerificationSent) {
      setMode('email-verification')
    }
  }, [emailVerificationSent])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let response

      switch (mode) {
        case 'signup':
          response = await signUpWithEmail({ email, password, fullName })
          break
        case 'signin':
          response = await signInWithEmail({ email, password })
          break
        case 'forgot-password':
          response = await resetPassword(email)
          break
        default:
          return
      }

      if (response.success) {
        setSuccess(response.message || 'Success!')
        if (!response.requiresVerification && mode !== 'forgot-password') {
          // Close modal on successful sign in
          setTimeout(() => onClose(), 1500)
        }
      } else {
        setError(response.error || 'An error occurred')
        if (response.requiresVerification) {
          setMode('email-verification')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await resendVerification(email)
      if (response.success) {
        setSuccess(response.message || 'Verification email sent!')
      } else {
        setError(response.error || 'Failed to resend verification email')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'strong': return 'w-full'
      case 'medium': return 'w-2/3'
      default: return 'w-1/3'
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

  const renderContent = () => {
    switch (mode) {
      case 'email-verification':
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
                Check Your Email
              </h2>
              <p className="text-slate-400">
                We've sent a verification link to <span className="text-purple-400">{email}</span>
              </p>
            </div>

            <div className="glass rounded-lg p-4 mb-6 border border-purple-500/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  <p className="mb-2">Please check your email and click the verification link to complete your registration.</p>
                  <p className="text-slate-400">Don't see the email? Check your spam folder or click below to resend.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <StarBorder
                as="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <div className="spinner-3d"></div>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </div>
              </StarBorder>

              <StarBorder
                as="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setSuccess('')
                }}
                className="w-full"
                color="rgb(100, 116, 139)"
              >
                Back to Sign In
              </StarBorder>
            </div>
          </>
        )

      case 'forgot-password':
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
                Reset Password
              </h2>
              <p className="text-slate-400">
                Enter your email address and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
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

              <StarBorder
                as="button"
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner-3d mx-auto"></div>
                ) : (
                  'Send Reset Link'
                )}
              </StarBorder>
            </form>

            <div className="text-center">
              <StarBorder
                as="button"
                onClick={() => setMode('signin')}
                className="text-sm"
                color="rgb(100, 116, 139)"
              >
                Back to Sign In
              </StarBorder>
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-serif mb-2 text-gradient">
                {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400">
                {mode === 'signup' 
                  ? 'Create your account to start practicing interviews' 
                  : 'Sign in to continue your interview preparation'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input w-full px-4 py-3 text-white placeholder-slate-400 rounded-lg interactive"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
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
                    placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    required
                    minLength={mode === 'signup' ? 8 : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password strength indicator for signup */}
                {mode === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Password strength</span>
                      <span className="capitalize">{passwordStrength}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <StarBorder
                as="button"
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner-3d mx-auto"></div>
                ) : (
                  mode === 'signup' ? 'Create Account' : 'Sign In'
                )}
              </StarBorder>
            </form>

            <div className="text-center">
              <StarBorder
                as="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup')
                  setError('')
                  setSuccess('')
                }}
                className="text-sm"
                color="rgb(168, 85, 247)"
              >
                {mode === 'signup' 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </StarBorder>
            </div>
          </>
        )
    }
  }

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

        {renderContent()}
      </div>
    </div>
  )
}