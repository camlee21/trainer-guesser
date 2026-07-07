
import { useState, useEffect } from 'react'

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      const midnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ))
      const diff = midnight - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '16px',
        width: '100%',
    }}>
        <div style={{
        background: 'var(--bg-main)',
        border: '1px solid var(--accent-border)',
        borderRadius: '16px',
        padding: '0.6rem 1.4rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4), 0 0 12px var(--accent-glow)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        }}>
        <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
        }}>
            Next Trainer
        </span>
        <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '1rem',
            color: 'var(--accent)',
            letterSpacing: '0.05em',
            textShadow: '0 0 12px var(--accent-glow)',
        }}>
            {timeLeft}
        </span>
        </div>
    </div>
    )
}