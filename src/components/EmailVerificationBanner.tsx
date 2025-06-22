/**
 * Email Verification Banner Component
 * Shows a banner for users who haven't verified their email
 */

import React, { useState } from 'react'
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Don't show banner if user is verified or banner is dismissed
  if (!user || user.email_confirmed_at || !isVisible) {
    return null
  }

  const handleResendVerification = async () => {
    if (!user.email) return

    setIsResending(true)
    try {
      const response = await resendVerification(user.email)
      if (response.success) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Failed to resend verification:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-300 mb-1">
              Please verify your email address
            </h3>
            <p className="text-sm text-amber-200/80 mb-3">
              We've sent a verification link to <span className="font-medium">{user.email}</span>. 
              Please check your inbox and click the link to verify your account.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending || resendSuccess}
                className="inline-flex items-center space-x-2 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    <span>Resend Email</span>
                  </>
                )}
              </button>
              <span className="text-xs text-amber-200/60">
                Don't see it? Check your spam folder
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-400/60 hover:text-amber-400 transition-colors p-1"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}