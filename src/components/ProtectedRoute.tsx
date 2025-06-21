import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StarBorder } from './ui/star-border'
import { Mail, LogOut } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, resendConfirmationEmail, signOut } = useAuth()
  const location = useLocation()
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [resendError, setResendError] = useState('')

  const handleResend = async () => {
    if (!user?.email) return
    setResendStatus('loading')
    setResendError('')
    try {
      await resendConfirmationEmail(user.email)
      setResendStatus('success')
    } catch (err) {
      const error = err as Error
      setResendError(error.message || 'Failed to resend email.')
      setResendStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex items-center justify-center">
        <div className="relative z-10 animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-professional text-white overflow-hidden relative flex items-center justify-center p-4">
        <div className="particles absolute inset-0 z-[1]">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="glass-strong rounded-2xl p-8 md:p-12 border border-purple-500/30 card-3d animate-scale-in">
            <Mail className="h-16 w-16 mx-auto text-purple-400 mb-6 float" />
            <h1 className="text-3xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Verify Your Email
            </h1>
            <p className="text-slate-300 mb-2">
              We've sent a confirmation link to your email address:
            </p>
            <p className="text-purple-300 font-semibold text-lg mb-6 glass rounded-lg p-2">
              {user.email}
            </p>
            <p className="text-slate-400 mb-8">
              Please click the link in that email to finish setting up your account.
            </p>
            
            {resendStatus !== 'success' && (
              <StarBorder
                as="button"
                onClick={handleResend}
                disabled={resendStatus === 'loading'}
                className="w-full max-w-xs mx-auto mb-4 disabled:opacity-50"
              >
                {resendStatus === 'loading' ? 'Sending...' : 'Resend Confirmation Email'}
              </StarBorder>
            )}

            {resendStatus === 'success' && (
              <p className="text-green-400 mb-4 animate-fade-in">
                A new confirmation link has been sent!
              </p>
            )}
            
            {resendStatus === 'error' && (
              <p className="text-red-400 mb-4 text-sm animate-fade-in">
                Error: {resendError}
              </p>
            )}

            <div className="mt-6 border-t border-slate-700/50 pt-6">
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-white transition-colors text-sm flex items-center justify-center mx-auto space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}