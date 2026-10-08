import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuthContext } from '../contexts/AuthContext'
import ColourPicker from './ColourPicker'
import Footer from './Footer'
import AuthModal from './AuthModal'
import AccountMenu from './AccountMenu'
import MedalBox from './MedalBox'
import { useMedals } from '../contexts/MedalsContext'
import { medalStage } from '../lib/medals'

export default function Layout({ children }) {
  const { bgColor, accentColor, handleBgChange, handleAccentChange } = useTheme()
  const { user, signOut } = useAuthContext()
  const { earnedCount, toasts, dismissToast } = useMedals()
  const [modalOpen, setModalOpen] = useState(false)
  const [medalBoxOpen, setMedalBoxOpen] = useState(false)
  const closeMedalBox = useCallback(() => setMedalBoxOpen(false), [])

  return (
    <div className="app-root">
      {/* A plain bar of controls along the top, like a daily-game header; the banner gets the stage below it */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-group">
            <ColourPicker color={bgColor} accent={accentColor} onBgChange={handleBgChange} onAccentChange={handleAccentChange} />
            {/* Logged out, it stays reachable and offers the login that unlocks it */}
            <button
              type="button"
              onClick={() => (user ? setMedalBoxOpen(true) : setModalOpen(true))}
              title={user ? 'Medal Box' : 'Log in to collect medals'}
              aria-label={user ? 'Medal Box' : 'Medal Box (log in to collect medals)'}
              className={`topbar-btn medal-btn ${user ? '' : 'locked'}`}
            >
              <img className="medal-img" src={user ? `/medal_imgs/medal-${medalStage(earnedCount)}.png` : '/medal_imgs/hint-medal.png'} alt="" />
              <span className="topbar-btn-label">Medal Box</span>
            </button>
          </div>

          <div className="topbar-group">
            <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" className="topbar-btn kofi-btn" aria-label="Support me on Ko-fi">
              <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" />
              <span className="kofi-label-long">Support me on Ko-fi</span>
              <span className="kofi-label-short" aria-hidden="true">Ko-fi</span>
            </a>
            {user ? (
              <AccountMenu user={user} onSignOut={signOut} />
            ) : (
              <button onClick={() => setModalOpen(true)} className="auth-btn accent">Log In</button>
            )}
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        <header className="site-header">
          <h1 className="seo-heading">Who's That Trainer? — Daily Pokémon Trainer Guessing Game</h1>
          <Link to="/" className="site-logo">
            <img src="/banner.png" alt="Who's that Trainer?" />
          </Link>
        </header>

        {children}

        <Footer />
      </div>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
      {medalBoxOpen && user && <MedalBox onClose={closeMedalBox} />}

      {/* Medal notifications: each disappears after 3 seconds, ✕ clears it sooner, clicking it opens the Medal Box */}
      {toasts.length > 0 && (
        <div className="medal-toasts">
          {toasts.map(toast => (
            <div key={toast.key} className="medal-toast" role="status">
              <button
                type="button"
                className="medal-toast-open"
                onClick={() => { dismissToast(toast.key); setMedalBoxOpen(true) }}
              >
                <img className="medal-img" src={`/medal_imgs/medal-${toast.stage}.png`} alt="" />
                <span>{toast.message}</span>
              </button>
              <button type="button" className="medal-toast-close" aria-label="Dismiss" onClick={() => dismissToast(toast.key)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
