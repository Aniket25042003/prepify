import React from 'react'
import { Clock, Trash2, Calendar, BookOpen, Play, Award, Zap, Code, Target, User, TrendingUp } from 'lucide-react'
import { InterviewSession } from '../lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts'

interface DashboardStatsProps {
  totalInterviews: number
  avgDuration: number
  interviewTypes: number
  interviewsThisMonth: number
  totalCodingSessions: number
  interviewSessions: InterviewSession[]
  loading: boolean
  onDeleteInterviewSession: (id: string) => void
}

export function DashboardStats({
  totalInterviews,
  avgDuration,
  interviewTypes,
  interviewsThisMonth,
  totalCodingSessions,
  interviewSessions,
  loading,
  onDeleteInterviewSession
}: DashboardStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'Technical': return Target
      case 'Behavioral': return User
      case 'System Design': return TrendingUp
      default: return Award
    }
  }

  // Prepare data for charts
  const prepareChartData = () => {
    // Interview type distribution
    const typeDistribution = interviewSessions.reduce((acc, session) => {
      acc[session.interview_type] = (acc[session.interview_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const pieData = Object.entries(typeDistribution).map(([type, count]) => ({
      name: type,
      value: count
    }))

    // Monthly interview trend (last 6 months)
    const monthlyData = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      const monthInterviews = interviewSessions.filter(session => {
        const sessionDate = new Date(session.created_at)
        return sessionDate.getMonth() === date.getMonth() && 
               sessionDate.getFullYear() === date.getFullYear()
      }).length
      
      monthlyData.push({
        month: monthName,
        interviews: monthInterviews
      })
    }

    // Duration distribution
    const durationRanges = [
      { range: '15-30m', min: 15, max: 30, count: 0 },
      { range: '31-45m', min: 31, max: 45, count: 0 },
      { range: '46-60m', min: 46, max: 60, count: 0 }
    ]

    interviewSessions.forEach(session => {
      const range = durationRanges.find(r => session.duration >= r.min && session.duration <= r.max)
      if (range) range.count++
    })

    const durationData = durationRanges.map(r => ({
      range: r.range,
      count: r.count
    }))

    // Performance score (mock data based on interview frequency and types)
    const performanceScore = Math.min(100, Math.max(0, 
      (totalInterviews * 10) + 
      (interviewTypes * 15) + 
      (interviewsThisMonth * 5)
    ))

    return {
      pieData,
      monthlyData,
      durationData,
      performanceScore
    }
  }

  const chartData = prepareChartData()
  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-3 border border-slate-700/30 backdrop-blur-sm">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in">
      {/* Enhanced Metrics Cards with Mini Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalInterviews}</div>
              <div className="text-slate-400 text-sm">Total Interviews</div>
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.monthlyData}>
                <Area 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#8b5cf6" 
                  fill="url(#purpleGradient)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-2">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{avgDuration}m</div>
              <div className="text-slate-400 text-sm">Avg Duration</div>
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.durationData}>
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-3">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{interviewTypes}</div>
              <div className="text-slate-400 text-sm">Interview Types</div>
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={25}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-800 to-purple-900 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{interviewsThisMonth}</div>
              <div className="text-slate-400 text-sm">This Month</div>
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyData}>
                <Line 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#6d28d9" 
                  strokeWidth={3}
                  dot={{ fill: '#6d28d9', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-5">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalCodingSessions}</div>
              <div className="text-slate-400 text-sm">Coding Sessions</div>
            </div>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" data={[{ name: 'Progress', value: Math.min(100, totalCodingSessions * 10) }]}>
                <RadialBar dataKey="value" fill="#3b82f6" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Overview Chart */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-strong rounded-xl p-6 border border-slate-700/30 card-3d">
          <h3 className="text-xl font-semibold mb-6 text-purple-400">Interview Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#8b5cf6" 
                  fill="url(#performanceGradient)" 
                  strokeWidth={3}
                />
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-strong rounded-xl p-6 border border-slate-700/30 card-3d">
          <h3 className="text-xl font-semibold mb-6 text-purple-400">Interview Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Duration Analysis */}
      <div className="glass-strong rounded-xl p-6 border border-slate-700/30 mb-12 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/50">
        <h3 className="text-xl font-semibold mb-6 text-purple-400">Interview Duration Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="url(#barGradient)" 
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "url(#barGradient)" }}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interview History Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold font-serif mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Your Interview History</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner-3d mx-auto mb-4"></div>
              <p className="text-slate-300">Loading your interview history...</p>
            </div>
          ) : interviewSessions.length === 0 ? (
            <div className="text-center py-12 glass-strong rounded-2xl border border-slate-700/30 animate-fade-in">
              <BookOpen className="h-16 w-16 text-slate-500 mx-auto mb-4 float" />
              <h3 className="text-xl font-semibold mb-2">No interview sessions yet</h3>
              <p className="text-slate-400">Start your first interview practice to begin building your skills!</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto grid gap-6">
              {interviewSessions.map((session, index) => {
                const IconComponent = getInterviewTypeIcon(session.interview_type)
                
                return (
                  <div
                    key={session.id}
                    className={`glass-strong rounded-xl p-6 border border-slate-700/30 card-3d group animate-fade-in stagger-${(index % 4) + 1}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-purple-400">{session.role}</h3>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300 text-sm">{session.company}</span>
                            <span className="text-slate-500">•</span>
                            <span className={`text-sm px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white`}>
                              {session.interview_type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(session.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration} minutes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onDeleteInterviewSession(session.id)}
                        aria-label="Delete session"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all duration-200 p-2 hover:bg-slate-700/50 rounded-lg interactive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-slate-200 leading-relaxed">
                      <p className="mb-2">{session.summary}</p>
                      <p className="text-sm text-slate-400 italic">💡 Detailed feedback was provided during the interview session</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
} 