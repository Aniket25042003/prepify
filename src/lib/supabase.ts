import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. Please check your .env file and ensure it contains your Supabase project URL.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file and ensure it contains your Supabase anonymous key.'
  )
}

// Add validation for URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(
    `Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. Please ensure it's a valid URL. Error: ${error}`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type DiaryEntry = {
  id: string
  user_id: string
  figure: string
  subject: string
  summary: string
  created_at: string
}

export type FigurePrompt = {
  id: string
  name: string
  prompt: string
  description?: string
  era?: string
}

export type FigureTopicPrompt = {
  id: string
  figure_name: string
  topic: string
  prompt: string
  created_at: string
}

export type InterviewSession = {
  id: string
  user_id: string
  role: string
  company: string
  interview_type: 'Technical' | 'Behavioral' | 'System Design'
  duration: number
  resume: string
  job_description: string
  additional_notes: string
  summary: string
  created_at: string
}

export type CodingSession = {
  id: string
  user_id: string
  platform_name: string
  platform_url: string
  created_at: string
}

export type UserSettings = {
  id: string
  user_id: string
  target_score: number
  created_at: string
  updated_at: string
}