import React, { useState, useEffect } from 'react'
import { LogOut, User, BarChart3, MessageSquare, Code2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, InterviewSession, CodingSession } from '../lib/supabase'
import { StarBorder } from '../components/ui/star-border'
import { analytics } from '../lib/analytics'
import { DashboardStats } from './DashboardStats'
import { MockInterview } from './MockInterview'
import { CodePractice } from './CodePractice'

const codingPlatforms = [
  {
    name: 'LeetCode',
    url: 'https://leetcode.com',
    description: 'Popular coding interview preparation platform',
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'HackerRank',
    url: 'https://hackerrank.com',
    description: 'Coding challenges and skill assessments',
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'CodeSignal',
    url: 'https://codesignal.com',
    description: 'Technical interviews and coding assessments',
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Codeforces',
    url: 'https://codeforces.com',
    description: 'Competitive programming contests',
    color: 'from-red-500 to-red-600'
  },
  {
    name: 'AtCoder',
    url: 'https://atcoder.jp',
    description: 'Japanese competitive programming platform',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'TopCoder',
    url: 'https://topcoder.com',
    description: 'Competitive programming and development challenges',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    name: 'Codewars',
    url: 'https://codewars.com',
    description: 'Coding kata and programming challenges',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    name: 'GeeksforGeeks',
    url: 'https://practice.geeksforgeeks.org',
    description: 'Programming practice and interview preparation',
    color: 'from-teal-500 to-teal-600'
  }
]

export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab')
    return tabFromUrl && ['dashboard', 'mock-interview', 'coding-practice'].includes(tabFromUrl) 
      ? tabFromUrl 
      : 'dashboard'
  })
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    interviewType: '' as 'Technical' | 'Behavioral' | 'System Design' | '',
    duration: 30,
    resume: '',
    jobDescription: '',
    additionalNotes: ''
  })
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([])
  const [codingSessions, setCodingSessions] = useState<CodingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
    analytics.viewDashboard()
  }, [user])

  const loadData = async () => {
    try {
      // Load interview sessions
      const { data: interviewData, error: interviewError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (interviewError) throw interviewError
      setInterviewSessions(interviewData || [])

      // Load coding sessions
      const { data: codingData, error: codingError } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (codingError) throw codingError
      setCodingSessions(codingData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteInterviewSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setInterviewSessions(sessions => sessions.filter(session => session.id !== id))
    } catch (error) {
      console.error('Error deleting interview session:', error)
    }
  }

  const handleCodingPlatformClick = async (platform: typeof codingPlatforms[0]) => {
    analytics.clickCodingPlatform(platform.name)
    
    try {
      // Record the coding session
      const { error } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: user?.id,
          platform_name: platform.name,
          platform_url: platform.url
        })

      if (error) throw error

      // Update local state to reflect the new coding session
      setCodingSessions(prev => [{
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        platform_name: platform.name,
        platform_url: platform.url,
        created_at: new Date().toISOString()
      }, ...prev])

      // Open the platform in a new tab
      window.open(platform.url, '_blank')
    } catch (error) {
      console.error('Error recording coding session:', error)
      // Still open the platform even if recording fails
      window.open(platform.url, '_blank')
    }
  }

  const startInterview = () => {
    if (formData.role && formData.company && formData.interviewType && formData.resume && formData.jobDescription) {
      const params = new URLSearchParams({
        role: formData.role,
        company: formData.company,
        interviewType: formData.interviewType,
        duration: formData.duration.toString(),
        resume: formData.resume,
        jobDescription: formData.jobDescription,
        additionalNotes: formData.additionalNotes
      })
      navigate(`/chat?${params.toString()}`)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = Boolean(formData.role && formData.company && formData.interviewType && formData.resume && formData.jobDescription)

  // Calculate metrics
  const totalInterviews = interviewSessions.length
  const totalCodingSessions = codingSessions.length
  const avgDuration = totalInterviews > 0 ? Math.round(interviewSessions.reduce((acc, session) => acc + session.duration, 0) / totalInterviews) : 0
  const interviewTypes = new Set(interviewSessions.map(s => s.interview_type)).size
  
  // Interview frequency (interviews this month)
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const interviewsThisMonth = interviewSessions.filter(session => 
    new Date(session.created_at) >= thisMonth
  ).length

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

  // Tab configuration
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'View your interview statistics and history'
    },
    {
      id: 'mock-interview',
      label: 'Mock Interview',
      icon: MessageSquare,
      description: 'Start a new AI-powered interview practice session'
    },
    {
      id: 'coding-practice',
      label: 'Coding Practice',
      icon: Code2,
      description: 'Practice coding on popular platforms'
    },
    {
      id: 'qa-session',
      label: 'Q&A Practice',
      icon: Sparkles,
      description: 'Upload resume and job description for personalized Q&A practice'
    }
  ]

  return (
    <div className="min-h-screen bg-professional text-white overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="particles">
        {particles}
      </div>
      

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-700/20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2 float">
                <div className="relative">
                  <img 
                    src="/Prepwiser.png" 
                    alt="Prepwiser Logo" 
                    className="h-8 w-8 object-contain pulse-glow"
                  />
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                </div>
                <span className="text-xl font-bold font-serif neon-glow">Prepwiser</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="glass px-4 py-2 rounded-lg border border-slate-700/30 interactive">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">{user?.user_metadata?.full_name || user?.email}</span>
                  </div>
                </div>
                <StarBorder
                  as="button"
                  onClick={signOut}
                  className="text-sm"
                  color="rgb(168, 85, 247)"
                >
                  <div className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                  </div>
                </StarBorder>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200 float">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Job Seeker'}!
            </h1>
            <p className="text-xl text-slate-300">
              Ready to ace your next interview with AI practice?
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="glass-strong rounded-xl p-2 border border-slate-700/30">
              <div className="flex space-x-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSearchParams({ tab: tab.id })
                      }}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <DashboardStats
              totalInterviews={totalInterviews}
              avgDuration={avgDuration}
              interviewTypes={interviewTypes}
              interviewsThisMonth={interviewsThisMonth}
              totalCodingSessions={totalCodingSessions}
              interviewSessions={interviewSessions}
              loading={loading}
              onDeleteInterviewSession={deleteInterviewSession}
            />
          )}

          {activeTab === 'mock-interview' && (
            <MockInterview
              formData={formData}
              onInputChange={handleInputChange}
              isFormValid={isFormValid}
              onStartInterview={startInterview}
            />
          )}

          {activeTab === 'coding-practice' && (
            <CodePractice
              codingPlatforms={codingPlatforms}
              onCodingPlatformClick={handleCodingPlatformClick}
            />
          )}

          {activeTab === 'qa-session' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-gradient">Q&A Practice</h2>
                <p className="text-slate-400 mb-8">Upload your resume and job description for personalized interview questions</p>
              </div>

              <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 card-3d animate-fade-in">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Coming Soon!</h3>
                    <p className="text-slate-300 text-lg mb-6">
                      We're working hard to bring you personalized Q&A sessions for your interviews.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        <h4 className="font-semibold text-white">Upload Resume</h4>
                      </div>
                      <p className="text-slate-400 text-sm ml-11">
                        Upload your resume and we'll analyze your experience, skills, and background.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">2</span>
                        </div>
                        <h4 className="font-semibold text-white">Job Description</h4>
                      </div>
                      <p className="text-slate-400 text-sm ml-11">
                        Provide the job description to understand the role requirements and company context.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">3</span>
                        </div>
                        <h4 className="font-semibold text-white">Personalized Q&A</h4>
                      </div>
                      <p className="text-slate-400 text-sm ml-11">
                        Get tailored questions and suggested answers based on your profile and the job requirements.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                    <h4 className="text-lg font-semibold text-white mb-3">What to Expect</h4>
                    <ul className="text-slate-300 space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Behavioral questions based on your experience</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Technical questions relevant to the role</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Company-specific questions and culture fit</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Suggested answers and talking points</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Practice mode with AI feedback</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <StarBorder
                      as="button"
                      disabled
                      className="w-full opacity-50 cursor-not-allowed"
                      color="rgb(168, 85, 247)"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="h-5 w-5" />
                        <span>Coming Soon - Stay Tuned!</span>
                      </div>
                    </StarBorder>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}