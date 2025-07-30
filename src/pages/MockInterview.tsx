import React from 'react'
import { MessageCircle } from 'lucide-react'
import { StarBorder } from '../components/ui/star-border'

interface MockInterviewProps {
  formData: {
    role: string
    company: string
    interviewType: '' | 'Technical' | 'Behavioral' | 'System Design'
    duration: number
    resume: string
    jobDescription: string
    additionalNotes: string
  }
  onInputChange: (field: string, value: string | number) => void
  isFormValid: boolean
  onStartInterview: () => void
}

export function MockInterview({ 
  formData, 
  onInputChange, 
  isFormValid, 
  onStartInterview 
}: MockInterviewProps) {
  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 card-3d animate-scale-in">
          <h2 className="text-2xl font-semibold mb-6 font-serif text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Start a New Interview Practice</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="animate-fade-in stagger-1">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Role You're Applying For
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => onInputChange('role', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none interactive"
              />
            </div>

            <div className="animate-fade-in stagger-2">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => onInputChange('company', e.target.value)}
                placeholder="e.g., Google, Microsoft, Startup Inc."
                className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none interactive"
              />
            </div>

            <div className="animate-fade-in stagger-3">
              <label className="block text-sm font-medium text-slate-300 mb-3" id="interview-type-label">
                Interview Type
              </label>
              <select
                aria-labelledby="interview-type-label"
                value={formData.interviewType}
                onChange={(e) => onInputChange('interviewType', e.target.value)}
                className="form-input w-full rounded-lg px-4 py-3 text-white focus:outline-none interactive"
              >
                <option value="">Select interview type...</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
              </select>
            </div>

            <div className="animate-fade-in stagger-4">
              <label className="block text-sm font-medium text-slate-300 mb-3" id="duration-label">
                Interview Duration (minutes)
              </label>
              <select
                aria-labelledby="duration-label"
                value={formData.duration}
                onChange={(e) => onInputChange('duration', parseInt(e.target.value))}
                className="form-input w-full rounded-lg px-4 py-3 text-white focus:outline-none interactive"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="animate-fade-in stagger-1">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Your Resume (paste as text)
              </label>
              <textarea
                value={formData.resume}
                onChange={(e) => onInputChange('resume', e.target.value)}
                placeholder="Paste your resume content here..."
                rows={8}
                className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
              />
            </div>

            <div className="animate-fade-in stagger-2">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Job Description (paste as text)
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => onInputChange('jobDescription', e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
                className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
              />
            </div>
          </div>

          <div className="mb-8 animate-fade-in stagger-3">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Additional Notes (optional)
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => onInputChange('additionalNotes', e.target.value)}
              placeholder="Any additional information you'd like the interviewer to know about you..."
              rows={3}
              className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
            />
          </div>

          <StarBorder
            as="button"
            onClick={onStartInterview}
            disabled={!isFormValid}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Start Interview Practice</span>
            </div>
          </StarBorder>
        </div>
      </div>
    </div>
  )
} 