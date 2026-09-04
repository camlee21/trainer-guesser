import { useState, useEffect } from 'react'

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function isDark(hex) {
  return luminance(hexToRgb(hex)) < 0.35
}

function applyBackground(hex, accentHex) {
  const { r, g, b } = hexToRgb(hex)
  const dark = isDark(hex)

  const factor = dark ? 1.3 : 0.8
  const r2 = Math.min(255, Math.round(r * factor))
  const g2 = Math.min(255, Math.round(g * factor))
  const b2 = Math.min(255, Math.round(b * factor))

  const text = dark ? '#e2e8f0' : '#1e293b'
  const textDim = dark ? '#94a3b8' : '#475569'
  // Light-mode green/red are darkened for contrast against the pale badge tints below.
  const green = dark ? '#4ade80' : '#15803d'
  const greenDk = dark ? '#16a34a' : '#166534'
  const greenHov = dark ? '#22c55e' : '#15803d'
  const gold = dark ? '#fbbf24' : '#b45309'
  const red = dark ? '#f87171' : '#b91c1c'

  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  const accentGlow = `rgba(${ar},${ag},${ab},0.35)`
  const accentHover = accentHex
  const accentBg = `rgba(${ar},${ag},${ab},0.15)`
  const accentBorder = `rgba(${ar},${ag},${ab},0.35)`

  const root = document.documentElement
  root.style.setProperty('--bg-main', `rgb(${r},${g},${b})`)
  root.style.setProperty('--bg-alt',  `rgb(${r2},${g2},${b2})`)
  root.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${dark ? '0.9' : '0.88'})`)
  root.style.setProperty('--panel-border', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)')
  root.style.setProperty('--input-bg', dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')

  // "Chrome" controls (filter buttons, toggles, dividers) — were hardcoded white-alpha, invisible on light themes.
  root.style.setProperty('--chrome-bg', dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)')
  root.style.setProperty('--chrome-bg-hover', dark ? 'rgba(255,255,255,0.20)' : 'rgba(15,23,42,0.14)')
  root.style.setProperty('--chrome-text', dark ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.65)')
  root.style.setProperty('--chrome-text-hover', dark ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.9)')
  root.style.setProperty('--badge-opacity', dark ? '1' : '2.5')
  root.style.setProperty('--text', text)
  root.style.setProperty('--text-dim', textDim)
  root.style.setProperty('--green', green)
  root.style.setProperty('--green-dark', greenDk)
  root.style.setProperty('--green-hover', greenHov)
  root.style.setProperty('--gold', gold)
  root.style.setProperty('--red', red)
  root.style.setProperty('--suggestions-bg', dark ? 'rgba(15,23,42,0.97)' : 'rgba(248,250,252,0.98)')

  // Status badge tints: dark mode keeps a low-alpha wash, light mode uses solid pale colors for contrast.
  root.style.setProperty('--badge-green-bg', dark ? 'rgba(74,222,128,0.22)' : '#dcfce7')
  root.style.setProperty('--badge-green-border', dark ? 'rgba(74,222,128,0.5)' : '#86efac')
  root.style.setProperty('--badge-gold-bg', dark ? 'rgba(251,191,36,0.22)' : '#fef3c7')
  root.style.setProperty('--badge-gold-border', dark ? 'rgba(251,191,36,0.5)' : '#fcd34d')
  root.style.setProperty('--badge-red-bg', dark ? 'rgba(248,113,113,0.22)' : '#fee2e2')
  root.style.setProperty('--badge-red-border', dark ? 'rgba(248,113,113,0.5)' : '#fca5a5')
  // Thin dark stroke on light-mode badge text — same-hue text-on-tint (green-on-mint etc.) passes contrast math but is still hard to read at a glance, especially for red-green color blindness.
  root.style.setProperty('--badge-text-stroke', dark ? '0px transparent' : '0.4px rgba(0,0,0,0.4)')

  root.style.setProperty('--accent', accentHex)
  root.style.setProperty('--accent-glow', accentGlow)
  root.style.setProperty('--accent-hover', accentHover)
  root.style.setProperty('--accent-bg', accentBg)
  root.style.setProperty('--accent-border', accentBorder)
  root.style.setProperty('--accent-text', dark ? '#ffffff' : '#ffffff')
}

const DEFAULT_COLOR = '#16283f'
const DEFAULT_ACCENT = '#7ab8ff'

// Every pairing keeps the accent clearly lighter/more saturated than its background for contrast.
export const PRESETS = [
  { bg: '#16283f', accent: '#7ab8ff', label: 'Default' },
  { bg: '#eef1f6', accent: '#3d63c9', label: 'Light' },
  { bg: '#201f29', accent: '#f0b93d', label: 'Charcoal' },
  { bg: '#0f2e63', accent: '#4fd1ff', label: 'Ocean' },
  { bg: '#0b2f22', accent: '#34d399', label: 'Forest' },
  { bg: '#4a1420', accent: '#ff8a3d', label: 'Crimson' },
  { bg: '#3b2a12', accent: '#e0a458', label: 'Sepia' },
  { bg: '#22103f', accent: '#c084fc', label: 'Psychic' },
]

export function useTheme() {
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem('wtt-bg-color') || DEFAULT_COLOR
  })
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('wtt-accent-color') || DEFAULT_ACCENT
  })

  useEffect(() => {
    applyBackground(bgColor, accentColor)
  }, [bgColor, accentColor])

  function handleBgChange(hex) {
    setBgColor(hex)
    localStorage.setItem('wtt-bg-color', hex)
  }

  function handleAccentChange(hex) {
    setAccentColor(hex)
    localStorage.setItem('wtt-accent-color', hex)
  }

  return { bgColor, accentColor, handleBgChange, handleAccentChange }
}