import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import HowToPlay from './pages/HowToPlay'
import Credits from './pages/Credits'
import TrainerSuggestions from './pages/TrainerSuggestions'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/trainer-suggestions" element={<TrainerSuggestions />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Layout>
  )
}