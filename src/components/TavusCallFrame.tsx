import React, { useState } from 'react'
import { Conversation, HairCheck } from '@tavus/react-components'

interface TavusCallFrameProps {
  conversationUrl?: string
  onLeave?: () => void
  isConnected: boolean
  isRecording: boolean
  onToggleRecording: () => void
  onToggleVideo: () => void
  onEndCall: () => void
}

export function TavusCallFrame({
  conversationUrl,
  onLeave,
  isConnected,
  isRecording,
  onToggleRecording,
  onToggleVideo,
  onEndCall
}: TavusCallFrameProps) {
  // Use onLeave when the call ends
  const handleEndCall = () => {
    onEndCall()
    onLeave?.()
  }
  if (!conversationUrl || !isConnected) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-xl">
        <div className="text-center text-slate-400">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-purple-400/30">
            <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {!conversationUrl ? 'Connecting to Interviewer...' : 'Establishing connection...'}
          </h3>
          <p className="text-slate-300">Please wait while we prepare your interview session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative glass rounded-xl overflow-hidden">
      {/* Tavus Conversation Block - This would be the actual Tavus component */}
      <div className="w-full h-full bg-white rounded-lg">
        {/* This is a placeholder for the actual Tavus Conversation block */}
        {/* In a real implementation, you would import and use the Tavus component like:
            import { Conversation } from '@tavus/react-components'
            
            <Conversation 
              conversationUrl={conversationUrl}
              onLeave={onLeave}
            />
        */}
        
        {/* Placeholder content that mimics the Tavus interface */}
        <div className="w-full h-full flex flex-col">
          {/* Main video area */}
          <div className="flex-1 relative bg-gray-900 rounded-t-lg overflow-hidden">
            {/* Main participant video */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-48 h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-purple-400/30">
                  <span className="text-6xl">👔</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Interviewer</h3>
                <p className="text-sm text-gray-300">Your interview session is ready</p>
              </div>
            </div>
            
            {/* Small inset video (user's video) */}
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-gray-800 rounded-lg border-2 border-white/20">
              <div className="w-full h-full flex items-center justify-center text-white">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>
          
          {/* Call controls */}
          <div className="bg-gray-800 p-4 rounded-b-lg">
            <div className="flex items-center justify-center space-x-4">
              {/* Mic Toggle */}
              <button
                onClick={onToggleRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                aria-label={isRecording ? "Mute microphone" : "Unmute microphone"}
              >
                {isRecording ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Video Toggle */}
              <button
                onClick={onToggleVideo}
                className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-all duration-300"
                aria-label="Toggle video"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </button>
              
              {/* End Call */}
              <button
                onClick={handleEndCall}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-300"
                aria-label="End call"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 