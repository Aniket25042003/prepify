import React from 'react'
import { VideoOff, User } from 'lucide-react'

interface AvatarDisplayProps {
  avatarUrl?: string
  isVideoEnabled: boolean
  agentConnected: boolean
  figureName: string
}

export function AvatarDisplay({ 
  avatarUrl, 
  isVideoEnabled, 
  agentConnected, 
  figureName
}: AvatarDisplayProps) {
  if (!isVideoEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-xl relative">
        {/* Modern Call Frame Design */}
        <div className="text-center text-slate-400 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-purple-400/30 avatar-frame float">
            <VideoOff className="h-12 w-12 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Video Disabled</h3>
          <p className="text-sm">Enable video to see your interviewer</p>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-8 h-8 bg-purple-500/20 rounded-full"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-pink-500/20 rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-4 h-4 bg-purple-500/20 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-pink-500/20 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!agentConnected || !avatarUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-xl relative overflow-hidden">
        {/* Modern Loading State */}
        <div className="text-center relative z-10">
          <div className="avatar-container">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-purple-400/30 avatar-frame relative">
              {agentConnected ? (
                <User className="h-16 w-16 text-purple-400" />
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {agentConnected ? `${figureName} is Ready` : 'Connecting to Interviewer...'}
          </h3>
          <p className="text-slate-300 mb-4">
            {agentConnected ? 'Your interview session is ready to begin' : 'Please wait while we prepare your interview session'}
          </p>
          {!agentConnected && (
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Establishing secure connection</span>
            </div>
          )}
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-purple-500/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-pink-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-purple-500/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative glass rounded-xl overflow-hidden avatar-container">
      {/* Tavus Call Frame */}
      <iframe
        src={avatarUrl}
        className="w-full h-full border-0 avatar-frame"
        allow="camera; microphone; autoplay; encrypted-media; fullscreen"
        title={`${figureName} Interview Session`}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onError={(e) => {
          console.error('Avatar iframe failed to load:', e)
          console.error('Avatar URL:', avatarUrl)
          console.error('This might be due to missing Tavus configuration or network issues')
        }}
        onLoad={() => {
  
        }}
      />
      

      

      
      {/* Connection Status */}
      <div className="absolute top-6 left-6">
        <div className="glass-strong rounded-full px-4 py-2 border border-green-500/30 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}