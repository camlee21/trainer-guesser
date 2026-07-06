import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import HowToPlay from './pages/HowToPlay'
import Stats from './pages/Stats'
import Credits from './pages/Credits'
import Privacy from './pages/Privacy'
import TrainerSuggestions from './pages/TrainerSuggestions'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function App() {
  return (
    <AuthProvider>
      <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/trainer-suggestions" element={<TrainerSuggestions />} />
          </Routes>
        <Analytics />
        <SpeedInsights />
      </Layout>
    </AuthProvider>
  )
}