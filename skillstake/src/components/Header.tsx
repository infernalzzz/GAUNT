import { Menu, X, User, LogOut, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoginModal from './LoginModal'
import SignUpModal from './SignUpModal'
import { useAdmin } from '../hooks/useAdmin'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const { isAdmin } = useAdmin()

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
  }

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false)
  }

  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">GAUNT.GG</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-white hover:text-gray-300 transition-colors">
              Home
            </Link>
            <a 
              href="#lobbies" 
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById('lobbies')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              Lobbies
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById('how-it-works')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              How it Works
            </a>
            <a 
              href="#faq" 
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById('faq')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              FAQ
            </a>
            {user && (
              <Link to="/social" className="text-white hover:text-gray-300 transition-colors">
                Social
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <User size={20} />
                  <span>{user.user_metadata?.username || user.email}</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Shield size={20} />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowSignUpModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gray-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              <Link to="/" className="block text-white hover:text-gray-300 px-3 py-2">
                Home
              </Link>
              <a 
                href="#lobbies" 
                onClick={(e) => {
                  e.preventDefault()
                  setIsMenuOpen(false)
                  const element = document.getElementById('lobbies')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="block text-white hover:text-gray-300 px-3 py-2"
              >
                Lobbies
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => {
                  e.preventDefault()
                  setIsMenuOpen(false)
                  const element = document.getElementById('how-it-works')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="block text-white hover:text-gray-300 px-3 py-2"
              >
                How it Works
              </a>
              <a 
                href="#faq" 
                onClick={(e) => {
                  e.preventDefault()
                  setIsMenuOpen(false)
                  const element = document.getElementById('faq')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="block text-white hover:text-gray-300 px-3 py-2"
              >
                FAQ
              </a>
              {user && (
                <Link to="/social" className="block text-white hover:text-gray-300 px-3 py-2">
                  Social
                </Link>
              )}
              <div className="pt-4 space-y-2">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <User size={20} />
                      <span>{user.user_metadata?.username || user.email}</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2 px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Shield size={20} />
                        <span>Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 text-gray-400 hover:text-white px-3 py-2 transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="block text-white hover:text-gray-300 px-3 py-2"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => setShowSignUpModal(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Sign Up Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setShowLoginModal(false)
          setShowSignUpModal(true)
        }}
      />
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSignUpSuccess={handleSignUpSuccess}
        onSwitchToLogin={() => {
          setShowSignUpModal(false)
          setShowLoginModal(true)
        }}
      />
    </header>
  )
}

export default Header
