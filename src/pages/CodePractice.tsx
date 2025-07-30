import React from 'react'
import { Code, ExternalLink } from 'lucide-react'

interface CodingPlatform {
  name: string
  url: string
  description: string
  color: string
}

interface CodePracticeProps {
  codingPlatforms: CodingPlatform[]
  onCodingPlatformClick: (platform: CodingPlatform) => void
}

export function CodePractice({ codingPlatforms, onCodingPlatformClick }: CodePracticeProps) {
  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 border border-slate-700/30 card-3d animate-scale-in">
          <h2 className="text-2xl font-semibold mb-6 font-serif text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Start a New Coding Practice</h2>
          
          <p className="text-slate-300 text-center mb-6">
            Practice your coding skills on popular platforms to prepare for technical interviews
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codingPlatforms.map((platform, index) => (
              <button
                key={platform.name}
                onClick={() => onCodingPlatformClick(platform)}
                className={`glass rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 interactive animate-fade-in stagger-${(index % 4) + 1} group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-gradient-to-r ${platform.color} rounded-lg flex items-center justify-center`}>
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-slate-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 