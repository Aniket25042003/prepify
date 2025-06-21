import React from 'react'
import { VideoOff, Loader } from 'lucide-react'

interface AvatarDisplayProps {
  avatarUrl?: string
  isVideoEnabled: boolean
  agentConnected: boolean
  figureName: string
}

export function AvatarDisplay({ avatarUrl, isVideoEnabled, agentConnected, figureName }: AvatarDisplayProps) {
  if (!isVideoEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-xl">
        <div className="text-center text-slate-400">
          <VideoOff className="h-16 w-16 mx-auto mb-4 float" />
          <p>Video disabled</p>
        </div>
      </div>
    )
  }

  if (!agentConnected || !avatarUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-xl">
        <div className="text-center">
          <div className="avatar-container">
            <div className="w-32 h-32 bg-gradient-to-r from-amber-500/20 to-slate-500/20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-amber-400/30 avatar-frame">
              {agentConnected ? (
                <span className="text-4xl">👔</span>
              ) : (
                <div className="spinner-3d"></div>
              )}
            </div>
          </div>
          <p className="text-slate-300 mb-2">
            {agentConnected ? `${figureName} is ready` : 'Connecting to interviewer...'}
          </p>
          {!agentConnected && (
            <p className="text-sm text-slate-400">Please wait while we prepare your interview session</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full glass rounded-xl overflow-hidden avatar-container">
      {/* Add error handling for iframe loading */}
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
          console.log('Avatar iframe loaded successfully for URL:', avatarUrl)
        }}
      />
    </div>
  )
}