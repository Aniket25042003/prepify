import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Save, AlertCircle, Play } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useConversation } from '../hooks/useConversation'
import { AvatarDisplay } from '../components/AvatarDisplay'
import { StarBorder } from '../components/ui/star-border'
import { analytics } from '../lib/analytics'

export function ChatPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { state, startConversation, toggleRecording, toggleVideo, endConversation, generateConversationSummary } = useConversation()
  const [conversationSummary, setConversationSummary] = useState('')

  const role = searchParams.get('role') || ''
  const company = searchParams.get('company') || ''
  const interviewType = searchParams.get('interviewType') as 'Technical' | 'Behavioral' | 'System Design' || 'Technical'
  const duration = parseInt(searchParams.get('duration') || '30')
  const resume = searchParams.get('resume') || ''
  const jobDescription = searchParams.get('jobDescription') || ''
  const additionalNotes = searchParams.get('additionalNotes') || ''

  const handleStartInterview = async () => {
    analytics.startInterview(interviewType)
    if (!user || !role || !company || !interviewType || !resume || !jobDescription) return

    try {
      await startConversation({
        role,
        company,
        interviewType,
        duration,
        resume,
        jobDescription,
        additionalNotes,
        userId: user.id,
      })
    } catch (error) {
      console.error('Failed to start interview:', error)
    }
  }

    const handleEndInterview = async () => {
    try {
      // Generate interview summary from Tavus if available
      let result = { summary: '', score: null, analysis: null }
      try {
        const generatedResult = await generateConversationSummary(role, company, interviewType)
        result = generatedResult || { 
          summary: generateFallbackSummary(role, company, interviewType, state.sessionDuration),
          score: null,
          analysis: null
        }
      } catch (error) {
        console.warn('Could not generate Tavus summary, using fallback:', error)
        result = {
          summary: generateFallbackSummary(role, company, interviewType, state.sessionDuration),
          score: null,
          analysis: null
        }
      }
      
      // End the interview after getting the summary
      await endConversation()
      
      const summary = result.summary || generateFallbackSummary(role, company, interviewType, state.sessionDuration)
      setConversationSummary(summary)
      // No longer setting score and analysis since feedback is provided during interview
      
      // Save to interview sessions
      if (user) {
        try {
          const { error } = await supabase
            .from('interview_sessions')
            .insert({
              user_id: user.id,
              role,
              company,
              interview_type: interviewType,
              duration,
              resume,
              job_description: jobDescription,
              additional_notes: additionalNotes,
              summary: summary
            })

          if (error) throw error
        } catch (error) {
          console.error('Error saving interview session:', error)
        }
      }
      
      // Always navigate back to dashboard after showing the feedback
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Error ending interview:', error)
    }
  }

  const handleToggleRecording = async () => {
    try {
      await toggleRecording()
    } catch (error) {
      console.error('Error toggling recording:', error)
    }
  }

  const handleToggleVideo = () => {
    toggleVideo()
  }

  const generateFallbackSummary = (role: string, company: string, interviewType: string, duration: number) => {
    const interviewLength = Math.floor(duration / 60)
    
    const summaries = {
      'Technical': `Completed a comprehensive ${interviewLength} minute technical interview for the ${role} position at ${company}. The session covered coding challenges, algorithmic thinking, and system design concepts. Technical problem-solving skills were assessed through practical coding exercises and architectural discussions. The interview provided valuable insights into technical competencies and approach to complex engineering problems.`,
      'Behavioral': `Participated in a ${interviewLength} minute behavioral interview for the ${role} role at ${company}. The discussion explored past experiences, leadership scenarios, and cultural fit assessment. Key topics included teamwork, conflict resolution, and professional growth experiences. The interview revealed important insights about work style, values, and potential contribution to the team.`,
      'System Design': `Engaged in a ${interviewLength} minute system design interview for the ${role} position at ${company}. The session focused on architectural thinking, scalability considerations, and design trade-offs. Topics covered included distributed systems, database design, and performance optimization strategies. The interview demonstrated systematic thinking and experience with large-scale system architecture.`
    }

    if (summaries[interviewType as keyof typeof summaries]) {
      return summaries[interviewType as keyof typeof summaries]
    }

    return `Completed a ${interviewLength} minute ${interviewType.toLowerCase()} interview for the ${role} position at ${company}. The session provided valuable insights into qualifications, experience, and potential fit for the role. The interview covered relevant topics and demonstrated key competencies required for success in the position.`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Create floating particles
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

  if (conversationSummary) {
    return (
      <div className="min-h-screen bg-professional text-white overflow-hidden relative flex items-center justify-center">
        {/* Animated Background Particles */}
        <div className="particles">
          {particles}
        </div>
        <div className="relative z-10 max-w-4xl mx-auto p-8">
          <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 text-center card-3d animate-scale-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow bg-gradient-to-r from-purple-500 to-purple-600`}>
              <Save className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Interview Session Saved!</h2>
            
            <p className="text-slate-300 mb-6">Your {interviewType.toLowerCase()} interview for {role} at {company} has been saved to your history.</p>
            
            <div className="glass rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold text-purple-400 mb-3">Session Summary</h3>
              <p className="text-sm text-slate-200">{conversationSummary}</p>
            </div>
            
            <div className="glass rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm">💡 Detailed feedback and performance insights were discussed during your interview session</p>
            </div>
            
            <p className="text-slate-400">Returning to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-professional text-white overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="particles">
        {particles}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-slate-700/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-end animate-fade-in">
              <div className="flex items-center space-x-6">

                
                <div className="text-right">
                  <h1 className="text-lg font-semibold text-gradient">{role} at {company}</h1>
                  <p className="text-sm text-slate-400">{interviewType} Interview</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {!state.isConnected ? (
              // Pre-interview Setup
              <div className="text-center">
                <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 mb-8 card-3d animate-scale-in">
                  <h2 className="text-3xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">
                    Ready for your {interviewType.toLowerCase()} interview?
                  </h2>
                  <p className="text-xl text-slate-300 mb-6">
                    Interviewing for <span className="text-purple-400 neon-glow">{role}</span> at <span className="text-purple-400 neon-glow">{company}</span>
                  </p>
                  
                  <div className="glass rounded-lg p-6 mb-6 text-left">
                    <h3 className="font-semibold mb-4 text-purple-400">Interview Details:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-400">Type:</span> {interviewType}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-400">Duration:</span> {duration} minutes
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-600/50">
                      <h4 className="font-medium text-purple-400 mb-2">What to Expect:</h4>
                      <p className="text-sm text-slate-400">
                        {interviewType === 'Technical' && 'Coding challenges, algorithmic thinking, and technical problem-solving.'}
                        {interviewType === 'Behavioral' && 'Past experiences, situational questions, and cultural fit assessment.'}
                        {interviewType === 'System Design' && 'Architecture discussions, scalability considerations, and design trade-offs.'}
                      </p>
                    </div>
                  </div>

                  <StarBorder
                    as="button"
                    onClick={handleStartInterview}
                    disabled={!role || !company || !interviewType}
                    className="disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                  >
                    <div className="flex items-center space-x-2 px-4">
                    <Play className="h-5 w-5" />
                    <span>Begin Interview</span>
                    </div>
                  </StarBorder>

                  {state.error && (
                    <div className="mt-6 glass rounded-lg p-4 border border-red-500/20">
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{state.error}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar Preview */}
                <div className="glass rounded-2xl p-8 border border-slate-700/30 animate-fade-in stagger-1">
                  <div className="avatar-container">
                    <div className="w-48 h-48 bg-gradient-to-r from-purple-500/20 to-slate-500/20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-purple-400/30 avatar-frame float">
                      <span className="text-6xl">👔</span>
                    </div>
                  </div>
                  <p className="text-slate-400">AI Interviewer will appear here during the session</p>
                </div>
              </div>
            ) : (
              // Active Interview
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Video/Avatar Section */}
                <div className="lg:col-span-4">
                  <div className="glass-strong rounded-2xl p-6 border border-slate-700/30 h-[70vh] flex items-center justify-center card-3d">
                    <AvatarDisplay
                      avatarUrl={state.avatarUrl}
                      isVideoEnabled={state.isVideoEnabled}
                      agentConnected={state.agentConnected}
                      figureName="AI Interviewer"
                      isRecording={state.isRecording}
                      onToggleVideo={handleToggleVideo}
                      onToggleMic={handleToggleRecording}
                      onEndCall={handleEndInterview}
                    />
                  </div>
                </div>

                {/* Controls Section */}
                <div className="space-y-6">


                  <div className="glass-strong rounded-xl p-6 border border-slate-700/30 card-3d">
                    <h3 className="font-semibold mb-4 text-purple-400">Session Info</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-mono text-white">{formatDuration(state.sessionDuration)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${state.isRecording ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {state.isRecording ? 'Recording' : 'Paused'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Agent:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${state.agentConnected ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {state.agentConnected ? 'Connected' : 'Connecting...'}
                        </span>
                      </div>
                    </div>

                    {state.error && (
                      <div className="mt-4 glass rounded-lg p-3 border border-red-500/20">
                        <div className="flex items-center space-x-2 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">{state.error}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <StarBorder
                        as="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full"
                        color="rgb(168, 85, 247)"
                      >
                        Back to Dashboard
                      </StarBorder>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}