import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRequest {
  room: string
  role: string
  company: string
  interviewType: 'Technical' | 'Behavioral' | 'System Design'
  duration: number
  resume: string
  jobDescription: string
  additionalNotes: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { room, role, company, interviewType, duration, resume, jobDescription, additionalNotes }: AgentRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Construct the complete interviewer prompt
    const systemPrompt = `
You are an experienced AI interviewer conducting a ${interviewType.toLowerCase()} interview for the ${role} position at ${company}.

INTERVIEW CONTEXT:
- Role: ${role}
- Company: ${company}
- Interview Type: ${interviewType}
- Duration: ${duration} minutes
- Candidate's Resume: ${resume}
- Job Description: ${jobDescription}
${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

PERSONALITY AND BEHAVIOR:
- Act as a professional, experienced interviewer
- Be friendly but maintain professionalism
- Ask relevant questions based on the interview type and job requirements
- Provide constructive feedback when appropriate
- Adapt your questions based on the candidate's responses
- Keep the interview focused and productive

INTERVIEW GUIDELINES:
- Keep responses conversational and engaging (2-3 sentences typically)
- Ask follow-up questions based on candidate responses
- Evaluate technical skills, problem-solving ability, and cultural fit
- Provide realistic interview scenarios and challenges
- Give constructive feedback and guidance when helpful

INTERVIEW TYPE SPECIFIC GUIDELINES:
${getInterviewTypeGuidelines(interviewType)}

Remember: You are conducting a real-time voice interview, so keep responses natural, professional, and engaging.
`

    // In a real implementation, you would:
    // 1. Connect to LiveKit room
    // 2. Initialize the AI agent with the system prompt
    // 3. Set up STT (Speech-to-Text) pipeline
    // 4. Configure LLM with the system prompt
    // 5. Set up TTS (Text-to-Speech) pipeline
    // 6. Handle real-time audio streaming

    // For now, return the configuration that would be used
    const agentConfig = {
      room,
      role,
      company,
      interviewType,
      systemPrompt,
      voiceSettings: {
        // Configure professional interviewer voice
        voice: 'professional-interviewer',
        speed: 1.0,
        pitch: 1.0,
      },
      llmSettings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 200, // Keep responses concise for voice
      },
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent configured successfully',
        config: agentConfig 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error configuring agent:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function getInterviewTypeGuidelines(interviewType: string): string {
  const guidelines = {
    'Technical': `
TECHNICAL INTERVIEW REQUIREMENTS:
- Start immediately with a coding problem relevant to the role
- Ask about specific technologies from their resume and job requirements
- Present real coding challenges they'd face in this position
- Evaluate their problem-solving approach step-by-step
- Ask about complexity analysis and optimization
- Discuss system architecture and technical trade-offs
- Test debugging skills with follow-up scenarios
- Ask about their experience with specific tools/frameworks mentioned in job description
- Challenge their technical decisions with "why" and "how" questions
- Focus on practical application of their skills to company problems

SAMPLE TECHNICAL QUESTIONS:
- "Let's start with a coding problem. How would you [specific algorithm/problem relevant to role]?"
- "I see you have experience with [technology from resume]. How would you use it to solve [company-specific challenge]?"
- "Walk me through how you'd optimize this code for [specific performance requirement]."`,
    
    'Behavioral': `
BEHAVIORAL INTERVIEW REQUIREMENTS:
- Ask about specific experiences from their resume using STAR method
- Focus on leadership, teamwork, and conflict resolution relevant to the role
- Evaluate cultural fit for the company specifically
- Ask about their motivation for this exact role and company
- Assess communication skills and emotional intelligence
- Dig into challenges they've faced similar to what they'd encounter here
- Ask about their working style and how it fits the team
- Evaluate their growth mindset and learning ability

SAMPLE BEHAVIORAL QUESTIONS:
- "Tell me about a time when you [specific scenario relevant to role]. What was the situation and how did you handle it?"
- "I see you worked on [project from resume]. What was the biggest challenge and how did you overcome it?"
- "How do you handle [specific challenge they'd face in this role]?"
- "What interests you specifically about this role at our company?"`,
    
    'System Design': `
SYSTEM DESIGN INTERVIEW REQUIREMENTS:
- Present system design challenges relevant to the company's scale and problems
- Evaluate architectural thinking and scalability considerations
- Ask about database design and data modeling decisions
- Assess understanding of distributed systems and microservices
- Test their knowledge of performance and reliability patterns
- Evaluate trade-offs between different architectural approaches
- Ask about their experience with systems similar to company's architecture
- Challenge their design decisions with constraints and edge cases

SAMPLE SYSTEM DESIGN QUESTIONS:
- "Design a system that handles [specific company challenge] at [relevant scale]."
- "How would you architect [system relevant to their role] to handle [specific requirements]?"
- "What are the trade-offs between [architectural approaches relevant to company tech stack]?"
- "How would you ensure [specific reliability/performance requirement] in your design?"`
  }

  return guidelines[interviewType as keyof typeof guidelines] || guidelines['Technical']
}