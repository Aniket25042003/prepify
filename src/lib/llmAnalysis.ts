// LLM Analysis Service for Interview Transcripts
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface TranscriptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface InterviewAnalysis {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  keyTopics: string[]
  detailedAnalysis: {
    communication: number
    technicalKnowledge: number
    problemSolving: number
    culturalFit: number
  }
}

export interface AnalysisRequest {
  transcript: TranscriptMessage[]
  role: string
  company: string
  interviewType: 'Technical' | 'Behavioral' | 'System Design'
  duration: number
  resume: string
  jobDescription: string
}

export class LLMAnalysisService {
  private apiKey: string

  constructor() {
    this.apiKey = OPENAI_API_KEY
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Using fallback analysis.')
    }
  }

  async analyzeInterview(request: AnalysisRequest): Promise<InterviewAnalysis> {
    try {
      // If we have OpenAI API key, use it for analysis
      if (this.apiKey && request.transcript.length > 1) {
        return await this.performLLMAnalysis(request)
      }
      
      // Fallback to enhanced rule-based analysis
      return this.performEnhancedFallbackAnalysis(request)
    } catch (error) {
      console.error('Error in LLM analysis:', error)
      return this.performEnhancedFallbackAnalysis(request)
    }
  }

  private async performLLMAnalysis(request: AnalysisRequest): Promise<InterviewAnalysis> {
    try {
      // Use Supabase Edge Function for secure LLM analysis
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'apikey': SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.statusText}`)
      }

      const analysis = await response.json()
      return analysis
    } catch (error) {
      console.warn('LLM analysis failed, using enhanced fallback:', error)
      return this.performEnhancedFallbackAnalysis(request)
    }
  }

  private performEnhancedFallbackAnalysis(request: AnalysisRequest): InterviewAnalysis {
    const { transcript, role, company, interviewType, duration } = request
    
    // Extract user messages (candidate responses)
    const userMessages = transcript.filter(msg => msg.role === 'user').map(msg => msg.content)
    const assistantMessages = transcript.filter(msg => msg.role === 'assistant').map(msg => msg.content)
    
    const allUserText = userMessages.join(' ').toLowerCase()
    const conversationLength = Math.floor(duration / 60)
    
    // Calculate base score based on interview type and content analysis
    let baseScore = this.calculateBaseScore(allUserText, interviewType, conversationLength)
    
    // Analyze communication quality
    const communicationScore = this.analyzeCommunication(userMessages)
    
    // Analyze technical knowledge (for technical interviews)
    const technicalScore = interviewType === 'Technical' ? 
      this.analyzeTechnicalContent(allUserText) : 
      this.analyzeRelevantSkills(allUserText, interviewType)
    
    // Analyze problem-solving approach
    const problemSolvingScore = this.analyzeProblemSolving(allUserText, interviewType)
    
    // Analyze cultural fit indicators
    const culturalFitScore = this.analyzeCulturalFit(allUserText, assistantMessages)
    
    // Calculate weighted final score
    const finalScore = Math.round(
      (baseScore * 0.3) +
      (communicationScore * 0.25) +
      (technicalScore * 0.25) +
      (problemSolvingScore * 0.15) +
      (culturalFitScore * 0.05)
    )
    
    // Generate feedback and insights
    const feedback = this.generateDetailedFeedback(
      finalScore, 
      interviewType, 
      role, 
      company, 
      conversationLength,
      { communicationScore, technicalScore, problemSolvingScore, culturalFitScore }
    )
    
    const strengths = this.identifyStrengths(allUserText, interviewType, {
      communication: communicationScore,
      technical: technicalScore,
      problemSolving: problemSolvingScore,
      culturalFit: culturalFitScore
    })
    
    const improvements = this.identifyImprovements(allUserText, interviewType, {
      communication: communicationScore,
      technical: technicalScore,
      problemSolving: problemSolvingScore,
      culturalFit: culturalFitScore
    })
    
    const keyTopics = this.extractKeyTopics(allUserText, interviewType)
    
    return {
      score: Math.max(0, Math.min(100, finalScore)),
      feedback,
      strengths,
      improvements,
      keyTopics,
      detailedAnalysis: {
        communication: communicationScore,
        technicalKnowledge: technicalScore,
        problemSolving: problemSolvingScore,
        culturalFit: culturalFitScore
      }
    }
  }

  private calculateBaseScore(text: string, interviewType: string, duration: number): number {
    let score = 75 // Base score
    
    // Adjust based on response length and engagement
    const wordCount = text.split(' ').length
    const expectedWords = duration * 150 // ~150 words per minute for good engagement
    
    if (wordCount > expectedWords * 0.8) {
      score += 10 // Good engagement
    } else if (wordCount < expectedWords * 0.4) {
      score -= 15 // Low engagement
    }
    
    // Interview type specific adjustments
    const typeKeywords = this.getTypeKeywords(interviewType)
    const keywordMatches = typeKeywords.filter(keyword => text.includes(keyword)).length
    score += Math.min(15, keywordMatches * 2)
    
    return score
  }

  private analyzeCommunication(messages: string[]): number {
    if (messages.length === 0) return 50
    
    let score = 70
    const avgLength = messages.reduce((acc, msg) => acc + msg.length, 0) / messages.length
    
    // Analyze response length variety
    if (avgLength > 100) score += 10 // Good detail
    if (avgLength < 30) score -= 15 // Too brief
    
    // Check for structured responses
    const structuredResponses = messages.filter(msg => 
      msg.includes('first') || msg.includes('second') || msg.includes('then') || 
      msg.includes('because') || msg.includes('therefore') || msg.includes('however')
    ).length
    
    score += Math.min(15, structuredResponses * 3)
    
    // Check for examples and specifics
    const exampleIndicators = messages.filter(msg =>
      msg.includes('example') || msg.includes('instance') || msg.includes('specifically') ||
      msg.includes('when i') || msg.includes('in my experience')
    ).length
    
    score += Math.min(10, exampleIndicators * 2)
    
    return Math.max(0, Math.min(100, score))
  }

  private analyzeTechnicalContent(text: string): number {
    const technicalTerms = [
      'algorithm', 'data structure', 'complexity', 'optimization', 'database',
      'api', 'framework', 'architecture', 'scalability', 'performance',
      'testing', 'debugging', 'version control', 'deployment', 'security',
      'microservices', 'cloud', 'container', 'kubernetes', 'docker'
    ]
    
    const matches = technicalTerms.filter(term => text.includes(term)).length
    let score = 60 + (matches * 3)
    
    // Check for specific technologies
    const technologies = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'mongodb',
      'aws', 'azure', 'git', 'linux', 'kubernetes', 'docker'
    ]
    
    const techMatches = technologies.filter(tech => text.includes(tech)).length
    score += techMatches * 2
    
    return Math.max(0, Math.min(100, score))
  }

  private analyzeRelevantSkills(text: string, interviewType: string): number {
    let score = 70
    
    if (interviewType === 'Behavioral') {
      const behavioralKeywords = [
        'leadership', 'team', 'collaboration', 'communication', 'conflict',
        'challenge', 'achievement', 'goal', 'motivation', 'feedback',
        'improvement', 'learning', 'adaptation', 'responsibility'
      ]
      
      const matches = behavioralKeywords.filter(keyword => text.includes(keyword)).length
      score += matches * 2
    } else if (interviewType === 'System Design') {
      const designKeywords = [
        'scale', 'architecture', 'design', 'system', 'distributed',
        'load balancing', 'caching', 'database', 'microservices',
        'availability', 'consistency', 'partition', 'replication'
      ]
      
      const matches = designKeywords.filter(keyword => text.includes(keyword)).length
      score += matches * 3
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private analyzeProblemSolving(text: string, interviewType: string): number {
    let score = 65
    
    const problemSolvingIndicators = [
      'approach', 'solution', 'strategy', 'method', 'process',
      'analyze', 'break down', 'step by step', 'consider',
      'alternative', 'trade-off', 'pros and cons', 'evaluate'
    ]
    
    const matches = problemSolvingIndicators.filter(indicator => text.includes(indicator)).length
    score += matches * 3
    
    // Check for structured thinking
    if (text.includes('first') && text.includes('then')) score += 10
    if (text.includes('because') || text.includes('therefore')) score += 5
    
    return Math.max(0, Math.min(100, score))
  }

  private analyzeCulturalFit(userText: string, assistantMessages: string[]): number {
    let score = 75
    
    const positiveIndicators = [
      'excited', 'passionate', 'interested', 'motivated', 'enjoy',
      'love', 'appreciate', 'value', 'believe', 'committed'
    ]
    
    const matches = positiveIndicators.filter(indicator => userText.includes(indicator)).length
    score += matches * 2
    
    // Check for questions about company/role (shows interest)
    if (userText.includes('question') || userText.includes('ask')) score += 5
    
    return Math.max(0, Math.min(100, score))
  }

  private generateDetailedFeedback(
    score: number, 
    interviewType: string, 
    role: string, 
    company: string, 
    duration: number,
    scores: { communicationScore: number, technicalScore: number, problemSolvingScore: number, culturalFitScore: number }
  ): string {
    let feedback = `Interview Performance Analysis for ${role} at ${company}\n\n`
    
    // Overall performance
    if (score >= 90) {
      feedback += "🌟 Exceptional Performance: You demonstrated outstanding qualifications and interview skills. "
    } else if (score >= 80) {
      feedback += "✅ Strong Performance: You showed solid competency and good interview presence. "
    } else if (score >= 70) {
      feedback += "👍 Good Performance: You demonstrated relevant skills with room for improvement. "
    } else if (score >= 60) {
      feedback += "⚠️ Moderate Performance: Some strengths shown, but significant areas need development. "
    } else {
      feedback += "📈 Development Needed: Focus on building core competencies and interview skills. "
    }
    
    feedback += `Your overall score of ${score}% reflects your readiness for this ${interviewType.toLowerCase()} interview.\n\n`
    
    // Detailed breakdown
    feedback += "📊 Performance Breakdown:\n"
    feedback += `• Communication: ${scores.communicationScore}% - ${this.getScoreDescription(scores.communicationScore, 'communication')}\n`
    feedback += `• ${interviewType === 'Technical' ? 'Technical Knowledge' : 'Relevant Skills'}: ${scores.technicalScore}% - ${this.getScoreDescription(scores.technicalScore, 'technical')}\n`
    feedback += `• Problem Solving: ${scores.problemSolvingScore}% - ${this.getScoreDescription(scores.problemSolvingScore, 'problem-solving')}\n`
    feedback += `• Cultural Fit: ${scores.culturalFitScore}% - ${this.getScoreDescription(scores.culturalFitScore, 'cultural-fit')}\n\n`
    
    // Interview-specific insights
    feedback += this.getInterviewTypeInsights(interviewType, scores)
    
    return feedback
  }

  private getScoreDescription(score: number, category: string): string {
    const descriptions = {
      communication: {
        high: "Clear, structured, and engaging responses",
        medium: "Generally clear with some areas for improvement",
        low: "Needs work on clarity and structure"
      },
      technical: {
        high: "Strong technical knowledge and terminology",
        medium: "Good understanding with some gaps",
        low: "Limited technical depth demonstrated"
      },
      'problem-solving': {
        high: "Systematic and analytical approach",
        medium: "Shows problem-solving ability",
        low: "Needs more structured thinking"
      },
      'cultural-fit': {
        high: "Strong alignment and enthusiasm",
        medium: "Good fit indicators",
        low: "Limited cultural alignment shown"
      }
    }
    
    const level = score >= 80 ? 'high' : score >= 65 ? 'medium' : 'low'
    return descriptions[category as keyof typeof descriptions][level]
  }

  private getInterviewTypeInsights(interviewType: string, scores: any): string {
    let insights = `🎯 ${interviewType} Interview Insights:\n`
    
    if (interviewType === 'Technical') {
      insights += "• Focus on demonstrating coding skills and system thinking\n"
      insights += "• Explain your thought process while solving problems\n"
      insights += "• Discuss trade-offs and optimization considerations\n"
    } else if (interviewType === 'Behavioral') {
      insights += "• Use the STAR method (Situation, Task, Action, Result)\n"
      insights += "• Provide specific examples from your experience\n"
      insights += "• Show self-awareness and learning from challenges\n"
    } else if (interviewType === 'System Design') {
      insights += "• Start with requirements gathering and clarification\n"
      insights += "• Discuss scalability and reliability considerations\n"
      insights += "• Consider multiple solutions and their trade-offs\n"
    }
    
    return insights + "\n"
  }

  private identifyStrengths(text: string, interviewType: string, scores: any): string[] {
    const strengths: string[] = []
    
    if (scores.communication >= 80) {
      strengths.push("Clear and articulate communication")
    }
    
    if (scores.technical >= 80) {
      strengths.push(interviewType === 'Technical' ? "Strong technical knowledge" : "Relevant domain expertise")
    }
    
    if (scores.problemSolving >= 80) {
      strengths.push("Systematic problem-solving approach")
    }
    
    if (scores.culturalFit >= 80) {
      strengths.push("Strong cultural fit and enthusiasm")
    }
    
    // Content-based strengths
    if (text.includes('example') || text.includes('instance')) {
      strengths.push("Provides concrete examples")
    }
    
    if (text.includes('learn') || text.includes('improve')) {
      strengths.push("Growth mindset and continuous learning")
    }
    
    if (text.includes('team') || text.includes('collaboration')) {
      strengths.push("Collaborative mindset")
    }
    
    return strengths.slice(0, 5) // Limit to top 5 strengths
  }

  private identifyImprovements(text: string, interviewType: string, scores: any): string[] {
    const improvements: string[] = []
    
    if (scores.communication < 70) {
      improvements.push("Work on structuring responses more clearly")
    }
    
    if (scores.technical < 70) {
      improvements.push(interviewType === 'Technical' ? 
        "Strengthen technical knowledge and terminology" : 
        "Develop deeper domain expertise")
    }
    
    if (scores.problemSolving < 70) {
      improvements.push("Practice systematic problem-solving approaches")
    }
    
    if (scores.culturalFit < 70) {
      improvements.push("Show more enthusiasm and company research")
    }
    
    // Content-based improvements
    if (!text.includes('example') && !text.includes('instance')) {
      improvements.push("Include more specific examples in responses")
    }
    
    if (text.split(' ').length < 200) {
      improvements.push("Provide more detailed and comprehensive answers")
    }
    
    if (!text.includes('question')) {
      improvements.push("Ask thoughtful questions about the role and company")
    }
    
    return improvements.slice(0, 5) // Limit to top 5 improvements
  }

  private extractKeyTopics(text: string, interviewType: string): string[] {
    const topics: string[] = []
    
    const topicPatterns = [
      { keywords: ['algorithm', 'code', 'programming'], topic: 'Programming & Algorithms' },
      { keywords: ['system', 'architecture', 'design'], topic: 'System Design' },
      { keywords: ['database', 'sql', 'data'], topic: 'Data Management' },
      { keywords: ['team', 'collaboration', 'leadership'], topic: 'Teamwork & Leadership' },
      { keywords: ['project', 'experience', 'work'], topic: 'Professional Experience' },
      { keywords: ['challenge', 'problem', 'solution'], topic: 'Problem Solving' },
      { keywords: ['learn', 'growth', 'development'], topic: 'Learning & Development' },
      { keywords: ['communication', 'presentation'], topic: 'Communication Skills' }
    ]
    
    topicPatterns.forEach(pattern => {
      if (pattern.keywords.some(keyword => text.includes(keyword))) {
        topics.push(pattern.topic)
      }
    })
    
    return topics.slice(0, 4) // Return up to 4 key topics
  }

  private getTypeKeywords(interviewType: string): string[] {
    const keywords = {
      'Technical': ['code', 'algorithm', 'system', 'database', 'api', 'framework', 'testing', 'debugging'],
      'Behavioral': ['experience', 'team', 'challenge', 'leadership', 'conflict', 'goal', 'achievement'],
      'System Design': ['scale', 'architecture', 'design', 'distributed', 'load', 'cache', 'database']
    }
    
    return keywords[interviewType] || []
  }
}