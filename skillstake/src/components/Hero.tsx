import { Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SignUpModal from './SignUpModal'

const Hero = () => {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't render hero section if user is logged in
  if (isLoading) {
    return null // or a loading spinner
  }

  if (user) {
    return null // Hide hero section for logged-in users
  }

  return (
    <section className="relative bg-gradient-to-br from-background via-background to-gray-900 py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Title */}
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Play. Win. Earn.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
          Challenge real players in your favorite games and get rewarded for skill.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button 
            onClick={() => setShowSignUpModal(true)}
            className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-5 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
          >
            <span className="flex items-center justify-center gap-2">
              Sign Up Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          <button 
            onClick={() => {
              const element = document.getElementById('lobbies')
              element?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group border-2 border-white/20 text-white hover:bg-white hover:text-black px-10 py-5 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            Browse Lobbies
          </button>
        </div>
        
        {/* Feature Highlights */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-white">
          <div className="flex items-center gap-3 group">
            <div className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
              <Check className="text-green-400" size={20} />
            </div>
            <span className="font-medium">Free signup</span>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
              <Check className="text-green-400" size={20} />
            </div>
            <span className="font-medium">Verification required to play</span>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
              <Check className="text-green-400" size={20} />
            </div>
            <span className="font-medium">No spam</span>
          </div>
        </div>
      </div>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSignUpSuccess={() => {
          setShowSignUpModal(false)
          // User will be automatically updated via auth state change
        }}
        onSwitchToLogin={() => {
          setShowSignUpModal(false)
          // Could open login modal if needed, but for now just close
        }}
      />
    </section>
  )
}

export default Hero
