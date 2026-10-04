import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuthContext } from '../contexts/AuthContext'
import ColourPicker from './ColourPicker'
import Footer from './Footer'
import AuthModal from './AuthModal'
import { medalStage } from '../lib/medals'

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
            {/* Medal earning isn't built yet, so signed-in players show the stage for 0 medals and the button does nothing */}
            <button
              type="button"
              disabled={!user}
              title={user ? 'Medal Box' : 'Log in to collect medals'}
              className={`kofi-btn medal-btn ${user ? '' : 'disabled'}`}
            >
              <img src={user ? `/medal_imgs/medal-${medalStage(0)}.png` : '/medal_imgs/hint-medal.png'} alt="" />
              <span>Medal Box</span>
            </button>
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
    </div>
  )
}
