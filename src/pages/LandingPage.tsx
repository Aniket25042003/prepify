import React from 'react'
import { useState } from 'react'
import { Users, Target, Brain, TrendingUp, Zap, Award, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { CardSpotlight } from '../components/ui/card-spotlight'
import { HeroSection } from '../components/ui/hero-section-dark'
import { StarBorder } from '../components/ui/star-border'

export function LandingPage() {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const interviewTypes = [
    { name: 'Technical Interviews', description: 'Coding challenges & algorithms', image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg', icon: Brain },
    { name: 'Behavioral Interviews', description: 'Past experiences & soft skills', image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', icon: Users },
    { name: 'System Design', description: 'Architecture & scalability', image: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg', icon: Target },
    { name: 'Mock Interviews', description: 'Realistic practice sessions', image: 'https://images.pexels.com/photos/5439381/pexels-photo-5439381.jpeg', icon: Award },
  ]

  const additionalTypes = [
    { name: 'FAANG Prep', description: 'Big tech company focus', image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', icon: Zap },
    { name: 'Startup Interviews', description: 'Fast-paced environment prep', image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg', icon: TrendingUp },
    { name: 'Leadership Roles', description: 'Management & strategy', image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg', icon: Target },
    { name: 'Career Transitions', description: 'Switching industries', image: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg', icon: CheckCircle },
  ]

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Interviews',
      description: 'Practice with our advanced AI interviewer that adapts to your responses and provides realistic interview scenarios.',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: Target,
      title: 'Targeted Practice',
      description: 'Focus on specific interview types - technical coding, behavioral questions, or system design challenges.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your interview performance over time and identify areas for improvement with detailed session summaries.',
      gradient: 'from-green-500 to-teal-600'
    }
  ]

  // Create floating particles
  const particles = Array.from({ length: 50 }, (_, i) => (
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

  return (
    <>
      <div className="min-h-screen text-white overflow-hidden relative">
        {/* Consistent Background with Hero Section Styling */}
        <div className="absolute top-0 z-[0] h-full w-full bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-80" />
        
        {/* Animated Background Particles */}
        <div className="particles absolute inset-0 z-[1]">
          {particles}
        </div>
        
      {/* New Hero Section */}
      <div className="relative z-10">
        <header className="absolute top-0 left-0 right-0 z-50 container mx-auto px-6 pt-8">
          <nav className="flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2 float">
              <div className="relative">
                <img 
                  src="/favicon.svg" 
                  alt="Prepwiser Logo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold font-serif neon-glow">Prepwiser</span>
            </div>
            <div className="flex items-center space-x-4">
              <StarBorder
                as="button"
                onClick={() => setShowAuthModal(true)}
                disabled={loading}
                className="disabled:opacity-50"
                color="rgb(168, 85, 247)"
              >
                    {loading ? (
                      <div className="spinner-3d mx-auto"></div>
                    ) : (
                      'Get Started'
                    )}
              </StarBorder>
            </div>
          </nav>
        </header>

        <HeroSection
          title="Ace Your Next Interview with AI"
          subtitle={{
            regular: "Practice with our ",
            gradient: "AI Interviewer"
          }}
          description="Practice technical, behavioral, and system design interviews with our advanced AI interviewer. Get personalized feedback, build confidence, and land your dream job with realistic interview simulations."
          ctaText="Start Practicing Now"
          ctaAction={() => setShowAuthModal(true)}
          bottomImage={{
            light: "/hero_image.png",
            dark: "/hero_image.png"
          }}
          gridOptions={{
            angle: 65,
            opacity: 0.2,
            cellSize: 50,
            lightLineColor: "#fbbf24",
            darkLineColor: "#fbbf24"
          }}
          className="min-h-screen"
        />
      </div>

      {/* Interview Types Preview */}
      <div className="relative z-10">
        
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Practice Different Interview Types</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Master every aspect of the interview process with our comprehensive practice sessions
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {interviewTypes.map((type, index) => {
              const IconComponent = type.icon
              return (
                <CardSpotlight
                  key={type.name}
                  className={`overflow-hidden interactive animate-fade-in stagger-${index + 1} transition-transform duration-300 hover:scale-105`}
                  color="#8b5cf6"
                  radius={300}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={type.image}
                      alt={type.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <div className="glass p-2 rounded-lg">
                        <IconComponent className="h-5 w-5 text-purple-300 relative z-20" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                    <p className="text-sm text-slate-300">{type.description}</p>
                  </div>
                </CardSpotlight>
              )
            })}
          </div>

          {/* Additional Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {additionalTypes.map((type, index) => {
              const IconComponent = type.icon
              return (
                <CardSpotlight
                  key={type.name}
                  className={`overflow-hidden interactive animate-fade-in stagger-${index + 1} transition-transform duration-300 hover:scale-105`}
                  color="#7c3aed"
                  radius={300}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={type.image}
                      alt={type.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <div className="glass p-2 rounded-lg">
                        <IconComponent className="h-5 w-5 text-purple-300 relative z-20" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                    <p className="text-sm text-slate-300">{type.description}</p>
                  </div>
                </CardSpotlight>
              )
            })}
          </div>
        </div>
      </div>

        {/* Features Section */}
        <section className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Why Choose Prepwiser?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Experience the future of interview preparation with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={feature.title} className={`text-center group animate-fade-in stagger-${index + 1}`}>
                  <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 card-3d shadow-elevated float-delayed`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 font-serif">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center glass-strong rounded-3xl p-12 card-3d">
            <h2 className="text-4xl font-bold font-serif mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Ready to Land Your Dream Job?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful candidates who've used Prepwiser to ace their interviews
            </p>
            <StarBorder
              as="button"
              onClick={() => setShowAuthModal(true)}
              disabled={loading}
              className="disabled:opacity-50"
              color="rgb(168, 85, 247)"
            >
              <div className="px-6">
              Start Your Journey Today
              </div>
            </StarBorder>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-slate-700/30">
          <div className="text-center">
            {/* Copyright */}
            <div className="text-slate-400 text-sm">
              <p>© 2025 Prepwiser. Built with cutting-edge AI technology.</p>
            </div>
          </div>
        </footer>
      </div>
      {/* AuthModal positioned outside the main container to prevent layout issues */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}