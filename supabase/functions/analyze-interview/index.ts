import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TranscriptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AnalysisRequest {
  transcript: TranscriptMessage[]
  role: string
  company: string
  interviewType: 'Technical' | 'Behavioral' | 'System Design'
  duration: number
  resume: string
  jobDescription: string
}

interface InterviewAnalysis {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client to verify the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const analysisRequest: AnalysisRequest = await req.json()
    
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Analyze the interview using OpenAI
    const analysis = await analyzeInterviewWithOpenAI(analysisRequest, openaiApiKey)
    
    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error analyzing interview:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function analyzeInterviewWithOpenAI(
  request: AnalysisRequest, 
  apiKey: string
): Promise<InterviewAnalysis> {
  const { transcript, role, company, interviewType, duration, resume, jobDescription } = request
  
  // Prepare the conversation for analysis
  const conversationText = transcript
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
    .join('\n\n')

  const analysisPrompt = `
You are an expert interview evaluator. Analyze this ${interviewType.toLowerCase()} interview for a ${role} position at ${company}.

INTERVIEW CONTEXT:
- Role: ${role}
- Company: ${company}
- Interview Type: ${interviewType}
- Duration: ${Math.floor(duration / 60)} minutes
- Resume Summary: ${resume.substring(0, 500)}...
- Job Requirements: ${jobDescription.substring(0, 500)}...

CONVERSATION TRANSCRIPT:
${conversationText}

Please provide a comprehensive analysis in the following JSON format:
{
  "score": <number 0-100>,
  "feedback": "<detailed feedback paragraph>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "keyTopics": ["<topic1>", "<topic2>", "<topic3>"],
  "detailedAnalysis": {
    "communication": <number 0-100>,
    "technicalKnowledge": <number 0-100>,
    "problemSolving": <number 0-100>,
    "culturalFit": <number 0-100>
  }
}

EVALUATION CRITERIA:
1. Communication: Clarity, structure, articulation
2. Technical Knowledge: Relevant skills and expertise for the role
3. Problem Solving: Analytical thinking and approach
4. Cultural Fit: Enthusiasm, values alignment, company interest

For ${interviewType} interviews, focus on:
${getInterviewTypeGuidance(interviewType)}

Provide honest, constructive feedback that helps the candidate improve while highlighting their strengths.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator. Provide detailed, constructive analysis in valid JSON format only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content

    // Parse the JSON response
    try {
      const analysis = JSON.parse(analysisText)
      
      // Validate the response structure
      if (!analysis.score || !analysis.feedback || !analysis.detailedAnalysis) {
        throw new Error('Invalid analysis structure')
      }
      
      return analysis
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Failed to parse analysis response')
    }

  } catch (error) {
    console.error('OpenAI analysis failed:', error)
    throw error
  }
}

function getInterviewTypeGuidance(interviewType: string): string {
  const guidance = {
    'Technical': `
- Coding skills and algorithmic thinking
- System design and architecture knowledge
- Problem-solving methodology
- Technical communication and explanation ability
- Knowledge of relevant technologies and frameworks`,
    
    'Behavioral': `
- Past experience examples using STAR method
- Leadership and teamwork scenarios
- Conflict resolution and communication skills
- Cultural fit and values alignment
- Career motivation and goals`,
    
    'System Design': `
- System architecture and scalability thinking
- Design trade-offs and decision-making
- Understanding of distributed systems
- Performance and reliability considerations
- Ability to handle ambiguous requirements`
  }

  return guidance[interviewType as keyof typeof guidance] || guidance['Technical']
}