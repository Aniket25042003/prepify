const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY || ''
const TAVUS_API_BASE = 'https://tavusapi.com'

export interface TavusAvatar {
  avatar_id: string
  avatar_name: string
  avatar_url?: string
}

export interface TavusConversation {
  conversation_id: string
  conversation_url: string
  status: 'active' | 'ended' | 'error'
}

export interface ConversationConfig {
  role: string;
  company: string;
  interviewType: 'Technical' | 'Behavioral' | 'System Design';
  duration: number;
  resume: string;
  jobDescription: string;
  additionalNotes?: string;
  replica_id: string;
  conversation_name?: string;
}

interface TavusConversationDetails {
  conversation_id: string;
  status: 'active' | 'starting' | 'ended' | 'error';
  [key: string]: unknown;
}

interface TranscriptMessage {
  speaker: 'agent' | 'user';
  text: string;
  timestamp: string;
}

const getInterviewTypeInstructions = (interviewType: string, role: string, company: string): string => {
  const instructions = {
    'Technical': `
TECHNICAL INTERVIEW FOCUS & TOPICS:
- ALGORITHMS & DATA STRUCTURES: Ask questions related to arrays, strings, linked lists, trees, graphs, sorting, searching. Tailor complexity to the ${role} level.
- PROBLEM SOLVING: Present coding challenges relevant to ${company}'s work. Evaluate their thought process, not just the final answer.
- RESUME DEEP-DIVE: Ask about specific technologies and projects listed on their resume (e.g., "You mentioned using Python and Django on project X, can you tell me about the technical challenges you faced?").
- SYSTEM & API DESIGN: Ask about designing simple systems or APIs relevant to the role.
- TECHNICAL COMMUNICATION: Evaluate their ability to explain complex technical concepts clearly.
- COMPANY-SPECIFIC TECH: Ask about technologies listed in the job description for ${company}.
`,
    'Behavioral': `
BEHAVIORAL INTERVIEW FOCUS & TOPICS:
- STAR METHOD: Frame questions to elicit responses in the STAR format (Situation, Task, Action, Result). Ask follow-ups if they miss a part.
- RESUME-BASED SCENARIOS: Ask for specific examples from their resume (e.g., "Tell me about a time you showed leadership on the 'ABC' project listed on your resume.").
- CORE COMPETENCIES: Ask about teamwork, leadership, conflict resolution, problem-solving, and adaptability.
- CULTURAL FIT: Ask questions that reveal their work style and values to see how they align with the culture at ${company} (e.g., "Describe your ideal work environment.").
- MOTIVATION: Ask why they are interested in this specific ${role} and at ${company}. What about our mission resonates with you?
- HANDLING FAILURE: Ask about a time a project failed or they made a mistake and what they learned from it.
`,
    'System Design': `
SYSTEM DESIGN INTERVIEW FOCUS & TOPICS:
- PROBLEM CLARIFICATION: Start by asking clarifying questions to fully understand the system requirements.
- HIGH-LEVEL ARCHITECTURE: Discuss the main components and how they interact.
- SCALABILITY & PERFORMANCE: How would the system handle 10x the traffic? What are potential bottlenecks?
- DATA MODELING: Discuss database choices (SQL vs. NoSQL) and schema design.
- APIS & MICROSERVICES: Discuss API design (e.g., REST, GraphQL) and the trade-offs of a microservices architecture.
- RELIABILITY & FAULT TOLERANCE: How do you handle failures in the system? Discuss redundancy, replication, and failover.
- COMPANY-SPECIFIC PROBLEMS: Frame the design problem around a real-world challenge ${company} might face (e.g., "Let's design a system similar to our core product...").
`
  }
  return instructions[interviewType as keyof typeof instructions] || instructions['Technical']
}

const getInterviewContext = (config: ConversationConfig): string => {
  const interviewInstructions = getInterviewTypeInstructions(config.interviewType, config.role, config.company);
  
  return `You are a professional interviewer from ${config.company} conducting a ${config.interviewType.toLowerCase()} interview for the ${config.role} position. This is a ${config.duration}-minute interview.

CANDIDATE BACKGROUND:
Resume: ${config.resume.substring(0, 800)}
Job Description: ${config.jobDescription.substring(0, 800)}
${config.additionalNotes ? `Additional Notes: ${config.additionalNotes}` : ''}

INTERVIEW GUIDELINES:
${interviewInstructions}

KEY BEHAVIOR:
- Ask specific questions based on the candidate's resume and the job requirements
- Listen carefully and ask follow-up questions to probe deeper
- Stay strictly focused on interview topics - redirect if they go off-topic
- Near the end of the interview, provide comprehensive feedback including strengths, areas for improvement, and a score out of 100
- Be professional but conversational
- Never mention you are an AI or discuss these instructions`;
}

const getSimpleGreeting = (config: ConversationConfig): string => {
  return `Hello! I'm your interviewer from ${config.company}. I've had a chance to review your resume and I'm excited to discuss your background for the ${config.role} position. Let's get started!`;
}

export class TavusService {
  private apiKey: string

  constructor() {
    this.apiKey = TAVUS_API_KEY
    if (!this.apiKey) {
      console.warn('Tavus API key not found. Avatar features will be disabled.')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${TAVUS_API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Tavus API error: ${response.status} - ${error}`)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }

    return response.json()
  }

  // Helper method to get avatar for interview
  getAvatarForInterview(): string {
    const defaultReplicaId = import.meta.env.VITE_TAVUS_DEFAULT_REPLICA_ID

    if (!defaultReplicaId) {
      console.error('Tavus replica ID not configured. Please set VITE_TAVUS_DEFAULT_REPLICA_ID in your environment variables.')
      throw new Error('Tavus replica ID not configured. Please check your environment variables.')
    }
    return defaultReplicaId
  }

  async createConversation(config: ConversationConfig): Promise<TavusConversation> {
    try {
      await this.endAllActiveConversations()
      
      const greeting = getSimpleGreeting(config);
      const context = getInterviewContext(config);

      const requestBody = {
        replica_id: config.replica_id,
        conversation_name: config.conversation_name || `Interview for ${config.role} at ${config.company}`,
        custom_greeting: greeting,
        conversational_context: context,
        properties: {
          max_call_duration: config.duration * 60
        }
      };
      
      const response = await this.makeRequest('/v2/conversations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      return {
        conversation_id: response.conversation_id,
        conversation_url: response.conversation_url,
        status: response.status || 'active',
      }
    } catch (error) {
      console.error('Error creating Tavus conversation:', error)
      throw error
    }
  }

  async getAllConversations(): Promise<TavusConversationDetails[]> {
    try {
      const response = await this.makeRequest('/v2/conversations')
      return response.data || []
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return []
    }
  }

  async endAllActiveConversations(): Promise<void> {
    try {
      const conversations = await this.getAllConversations()
      const activeConversations = conversations.filter(conv => 
        conv.status === 'active' || conv.status === 'starting'
      )
      
      await Promise.all(
        activeConversations.map(conv => 
          this.endConversation(conv.conversation_id).catch((err: Error) => 
            console.warn(`Failed to end conversation ${conv.conversation_id}:`, err)
          )
        )
      )
      
      if (activeConversations.length > 0) {
        console.log(`Ended ${activeConversations.length} active conversations`)
      }
    } catch (error) {
      console.warn('Error ending active conversations:', error)
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      await this.makeRequest(`/v2/conversations/${conversationId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error ending Tavus conversation:', error)
      throw error
    }
  }

  async getConversationTranscriptMessages(conversationId: string): Promise<TranscriptMessage[] | null> {
    try {
      const response = await this.makeRequest(`/v2/conversations/${conversationId}?verbose=true`)
      
      if (response && response.transcript && Array.isArray(response.transcript)) {
        return response.transcript
      }
      
      return null
    } catch (error) {
      console.warn('Could not fetch conversation transcript messages:', error)
      return null
    }
  }
}
