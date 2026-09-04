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
        className="icon-btn"
        style={{ position: 'relative' }}
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
        <div className="theme-picker-panel">
          <span className="theme-picker-label">Theme Presets</span>
          <div className="theme-swatch-grid">
            {PRESETS.map(p => {
              const isSelected = color === p.bg
              return (
                <button
                  key={p.bg}
                  title={p.label}
                  onClick={() => { onBgChange(p.bg); onAccentChange(p.accent) }}
                  className={`theme-swatch ${isSelected ? 'selected' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${p.bg} 55%, ${p.accent} 55%)` }}
                />
              )
            })}
          </div>

          <div className="theme-picker-divider" />

          <span className="theme-picker-label">Custom</span>

          <div className="theme-picker-custom">
            <div className="theme-color-field">
              <span className="theme-color-field-label">BG</span>
              <label className="theme-color-dial" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <input type="color" value={color} onChange={e => onBgChange(e.target.value)} />
              </label>
              <span className="theme-color-value">{color.toUpperCase()}</span>
            </div>

            <span style={{ color: '#475569', fontSize: '16px', marginTop: '4px' }}>⇄</span>

            <div className="theme-color-field">
              <span className="theme-color-field-label">Accent</span>
              <label className="theme-color-dial" style={{ borderColor: accent, boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 10px ${accent}55` }}>
                <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)} />
              </label>
              <span className="theme-color-value">{accent.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}