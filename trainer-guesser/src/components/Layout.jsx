import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuthContext } from '../contexts/AuthContext'
import ColourPicker from './ColourPicker'
import Footer from './Footer'
import AuthModal from './AuthModal'

export default function Layout({ children }) {
  const { bgColor, accentColor, handleBgChange, handleAccentChange } = useTheme()
  const { user, signOut } = useAuthContext()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="app-root">
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header className="site-header">

          <h1 className="seo-heading">Who's That Trainer? — Daily Pokémon Trainer Guessing Game</h1>

          <Link to="/" className="site-logo">
            <img src="/banner.png" alt="Who's that Trainer?" />
          </Link>

          <div className="header-actions">
            <ColourPicker color={bgColor} accent={accentColor} onBgChange={handleBgChange} onAccentChange={handleAccentChange} />
            <a href="https://voltorbflip.app" target="_blank" rel="noopener noreferrer" title="Voltorb Flip" className="icon-btn">
              <img src="/voltorbflipwebicon.png" alt="Voltorb Flip" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </a>
            <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" className="kofi-btn">
              <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" />
              <span>Support me on Ko-fi</span>
            </a>

            <div className="header-auth">
              {user ? (
                <>
                  <span className="auth-user-label">{user.user_metadata?.full_name?.split(' ')[0] ?? user.email.split('@')[0]}</span>
                  <button onClick={signOut} className="auth-btn">Sign Out</button>
                </>
              ) : (
                <button onClick={() => setModalOpen(true)} className="auth-btn accent">Log In</button>
              )}
            </div>
          </div>

        </header>

        {children}

        <Footer />
      </div>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}

      <Analytics />
      <SpeedInsights />
    </div>
  )
}
