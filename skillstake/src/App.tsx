import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import FeaturedLobbies from './components/FeaturedLobbies'
import HowItWorks from './components/HowItWorks'
import TransparentFees from './components/TransparentFees'
import TrustAndFairness from './components/TrustAndFairness'
import StatsBanner from './components/StatsBanner'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import ProfilePage from './components/ProfilePage'
import AdminDashboard from './components/AdminDashboard'
import AchievementDashboard from './components/AchievementDashboard'
import AchievementTracker from './components/AchievementTracker'
import SocialDashboard from './components/SocialDashboard'
import SocialIntegration from './components/SocialIntegration'
import BackToTop from './components/BackToTop'

function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedLobbies />
      <HowItWorks />
      <TransparentFees />
      <TrustAndFairness />
      <StatsBanner />
      <FAQ />
    </>
  )
}

function App() {
  return (
    <Router>
      <AchievementTracker>
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/achievements" element={<AchievementDashboard />} />
            <Route path="/social" element={<SocialDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <Footer />
          <SocialIntegration />
          <BackToTop />
        </div>
      </AchievementTracker>
    </Router>
  )
}

export default App