import { useState } from 'react'

export default function ShareButtons({ gameOver, guesses, dayNumber }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const triesText = gameOver === 'won'
    ? guesses.filter(g => g.id !== '__pass__').length === 1
      ? 'Guessed in 1 try!'
      : `Guessed after ${guesses.length} tries!`
    : "Couldn't guess today's trainer..."

  const shareText = `Who's That Trainer? Day #${dayNumber}\n${triesText} ${gameOver === 'won' ? '✅' : '❌'}\n\nTry today's puzzle at: https://whosthattrainer.app`

  function handleCopy() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleTweet() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleBluesky() {
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} className="share-btn">
        🔗 Share
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          zIndex: 50,
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid var(--panel-border)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '180px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Share
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                lineHeight: 1,
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            >
              ✕
            </button>
          </div>

          <button onClick={handleCopy} className="share-btn" style={{ width: '100%', justifyContent: 'flex-start' }}>
            {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
          </button>

          <button onClick={handleTweet} className="share-btn share-btn--twitter" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </button>

          <button onClick={handleBluesky} className="share-btn share-btn--bluesky" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky" width="13" height="13" style={{ flexShrink: 0 }} />
            Bluesky
          </button>
        </div>
      )}
    </div>
  )
}