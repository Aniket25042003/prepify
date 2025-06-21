import { useState, useEffect, useCallback } from 'react'
import { TavusService, TavusConversation, ConversationConfig as TavusConfig } from '../lib/tavus'
import { LLMAnalysisService } from '../lib/llmAnalysis'

export interface ConversationState {
  isConnected: boolean
  isRecording: boolean
  isVideoEnabled: boolean
  sessionDuration: number
  agentConnected: boolean
  avatarUrl?: string
  error?: string
  conversationId?: string
}

export interface ConversationConfig {
  role: string
  company: string
  interviewType: 'Technical' | 'Behavioral' | 'System Design'
  duration: number
  resume: string
  jobDescription: string
  additionalNotes: string
  userId: string
}

export interface ConversationMessage {
  timestamp: number
  speaker: 'user' | 'agent'
  content: string
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    isConnected: false,
    isRecording: false,
    isVideoEnabled: true,
    sessionDuration: 0,
    agentConnected: false,
  })

  const [tavusService] = useState(() => new TavusService())
  const [tavusConversation, setTavusConversation] = useState<TavusConversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([])
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null)
  const [llmAnalysisService] = useState(() => new LLMAnalysisService())

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state.isConnected && state.isRecording) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, sessionDuration: prev.sessionDuration + 1 }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [state.isConnected, state.isRecording])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results)
        const transcript = results
          .map(result => result[0].transcript)
          .join('')
        
        // Only add final results to avoid duplicates
        if (event.results[event.results.length - 1].isFinal && transcript.trim()) {
          addConversationMessage('user', transcript.trim())
        }
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error)
      }
      
      setSpeechRecognition(recognition)
    }
  }, [])

  const addConversationMessage = useCallback((speaker: 'user' | 'agent', content: string) => {
    setConversationMessages(prev => [...prev, {
      timestamp: Date.now(),
      speaker,
      content
    }])
  }, [])

  const startConversation = useCallback(async (config: ConversationConfig) => {
    try {
      setState(prev => ({ ...prev, error: undefined, isConnected: true, sessionDuration: 0, agentConnected: false, avatarUrl: undefined }));
      setConversationMessages([]);

      // Mock conversation for local dev
      if (!import.meta.env.VITE_TAVUS_API_KEY) {
        console.warn('Tavus API key not configured, using mock conversation.');
        setState(prev => ({ ...prev, conversationId: 'mock-conversation-id' }));
        
        setTimeout(() => {
          setState(prev => ({ ...prev, agentConnected: true, isRecording: true }));
          const greeting = `Hello! I'm ready to begin your ${config.interviewType} interview for the ${config.role} position at ${config.company}. Let's get started.`;
          addConversationMessage('agent', greeting);
        }, 2000);
        return;
      }

      // Real Tavus conversation
      try {
        const replicaId = tavusService.getAvatarForInterview();
        
        const tavusConfig: TavusConfig = {
          ...config,
          replica_id: replicaId,
        };

        const tavusConv = await tavusService.createConversation(tavusConfig);
        
        setTavusConversation(tavusConv);
        setState(prev => ({ 
          ...prev, 
          avatarUrl: tavusConv.conversation_url,
          conversationId: tavusConv.conversation_id
        }));

        setTimeout(() => {
          setState(prev => ({ ...prev, agentConnected: true, isRecording: true }));
          addConversationMessage('agent', `Hello! I'm your AI interviewer from ${config.company}. I'm ready to begin.`);
        }, 2000);

      } catch (tavusError) {
        console.error('Tavus conversation creation failed, falling back to mock:', tavusError);
        setState(prev => ({ ...prev, conversationId: 'fallback-conversation-id' }));
        setTimeout(() => {
          setState(prev => ({ ...prev, agentConnected: true, isRecording: true }));
          const greeting = `Hello! I'm ready to begin your ${config.interviewType} interview for the ${config.role} position at ${config.company}. Let's get started.`;
          addConversationMessage('agent', greeting);
        }, 2000);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to start conversation' }));
    }
  }, [tavusService, addConversationMessage]);

  const toggleRecording = useCallback(async () => {
    try {
      const newRecordingState = !state.isRecording
      
      if (newRecordingState && speechRecognition) {
        // Start speech recognition when recording starts
        speechRecognition.start()
      } else if (!newRecordingState && speechRecognition) {
        // Stop speech recognition when recording stops
        speechRecognition.stop()
      }
      
      setState(prev => ({ ...prev, isRecording: newRecordingState }))
    } catch (error) {
      console.error('Error toggling recording:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to toggle recording' 
      }))
    }
  }, [state.isRecording, speechRecognition])

  const toggleVideo = useCallback(() => {
    setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }))
  }, [])

  const endConversation = useCallback(async () => {
    try {
      // Stop speech recognition
      if (speechRecognition) {
        speechRecognition.stop()
      }
      
      // End Tavus conversation
      if (tavusConversation) {
        await tavusService.endConversation(tavusConversation.conversation_id)
        setTavusConversation(null)
      }

      setState({
        isConnected: false,
        isRecording: false,
        isVideoEnabled: true,
        sessionDuration: 0,
        agentConnected: false,
        avatarUrl: undefined,
        error: undefined,
        conversationId: undefined,
      })

    } catch (error) {
      console.error('Error ending conversation:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to end conversation' 
      }))
    }
  }, [tavusService, tavusConversation, speechRecognition])

  const generateConversationSummary = useCallback(async (role: string, company: string, interviewType: string) => {
    // Since feedback is now provided during the interview, just generate a simple summary
    const fallbackSummary = generateSummaryFromMessages(conversationMessages, role, company, interviewType, state.sessionDuration)
    return {
      summary: fallbackSummary,
      score: null,
      analysis: null
    }
  }, [conversationMessages, state.sessionDuration])

  const generateSummaryFromMessages = (messages: ConversationMessage[], role: string, company: string, interviewType: string, duration: number): string => {
    const conversationLength = Math.floor(duration / 60)
    return `Completed a ${conversationLength} minute ${interviewType.toLowerCase()} interview for the ${role} position at ${company}.`
  }

  return {
    state,
    tavusConversation,
    conversationMessages,
    startConversation,
    toggleRecording,
    toggleVideo,
    endConversation,
    generateConversationSummary,
  }
}