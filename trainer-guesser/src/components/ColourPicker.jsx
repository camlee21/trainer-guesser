import { useState, useRef, useEffect } from 'react'
import { PRESETS } from '../hooks/useTheme'

export default function ColourPicker({ color, accent, onBgChange, onAccentChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        title="Choose background & accent colour"
        onClick={() => setOpen(o => !o)}
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
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s, transform 0.15s',
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
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="var(--text)" strokeWidth="1.5" fill="none"/>
          {[
            ['#ef4444', 0], ['#f97316', 60], ['#eab308', 120],
            ['#22c55e', 180], ['#3b82f6', 240], ['#a855f7', 300]
          ].map(([c, angle]) => {
            const rad = (angle - 90) * Math.PI / 180
            return (
              <circle
                key={angle}
                cx={11 + 5.5 * Math.cos(rad)}
                cy={11 + 5.5 * Math.sin(rad)}
                r="2.5"
                fill={c}
              />
            )
          })}
          <circle cx="11" cy="11" r="2" fill="var(--text)" opacity="0.6"/>
        </svg>
        <span style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color} 50%, ${accent} 50%)`,
          border: '1.5px solid rgba(255,255,255,0.5)',
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(15,23,42,0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          minWidth: '210px',
        }}>

          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Theme Presets
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px', width: '100%' }}>
            {PRESETS.map(p => {
              const isSelected = color === p.bg
              return (
                <button
                  key={p.bg}
                  title={p.label}
                  onClick={() => { onBgChange(p.bg); onAccentChange(p.accent) }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${p.bg} 55%, ${p.accent} 55%)`,
                    border: isSelected ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 10px rgba(255,255,255,0.4)` : 'none',
                    transition: 'transform 0.1s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              )
            })}
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Custom
          </span>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BG</span>
              <label style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                cursor: 'pointer', display: 'block', position: 'relative',
              }}>
                <input type="color" value={color} onChange={e => onBgChange(e.target.value)}
                  style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{color.toUpperCase()}</span>
            </div>

            <span style={{ color: '#475569', fontSize: '16px', marginTop: '4px' }}>⇄</span>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accent</span>
              <label style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${accent}`, boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 10px ${accent}55`,
                cursor: 'pointer', display: 'block', position: 'relative',
              }}>
                <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)}
                  style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{accent.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}