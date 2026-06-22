
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import ColourPicker from './ColourPicker'
import Footer from './Footer'

export default function Layout({ children }) {
  const { bgColor, accentColor, handleBgChange, handleAccentChange } = useTheme()

  return (
    <div className="app-root">
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>

          <ColourPicker
            color={bgColor}
            accent={accentColor}
            onBgChange={handleBgChange}
            onAccentChange={handleAccentChange}
          />

          <Link to="/" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <h1 className="title" style={{ margin: 0 }}>Who's that Trainer?</h1>
            <p className="subtitle" style={{ margin: '5px 0 0 0' }}>Guess the trainer from their team</p>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="https://x.com/drag1ash"
              target="_blank"
              rel="noopener noreferrer"
              title="Twitter / X"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s, transform 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.16)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://ko-fi.com/I8P7210YG4"
              target="_blank"
              rel="noopener noreferrer"
              className="kofi-btn"
            >
              <img
                src="https://storage.ko-fi.com/cdn/cup-border.png"
                alt="Ko-fi cup"
                style={{ height: '18px', width: 'auto', display: 'initial' }}
              />
              <span>Support me on Ko-fi</span>
            </a>
          </div>
        </header>

        {children}

        <Footer />
      </div>

      <Analytics />
      <SpeedInsights />
    </div>
  )
}