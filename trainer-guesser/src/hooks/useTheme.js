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
  const green = dark ? '#4ade80' : '#16a34a'
  const greenDk = dark ? '#16a34a' : '#166534'
  const greenHov = dark ? '#22c55e' : '#15803d'
  const gold = dark ? '#fbbf24' : '#b45309'

  const { r: ar, g: ag, b: ab } = hexToRgb(accentHex)
  const accentGlow = `rgba(${ar},${ag},${ab},0.35)`
  const accentHover = accentHex
  const accentBg = `rgba(${ar},${ag},${ab},0.15)`
  const accentBorder = `rgba(${ar},${ag},${ab},0.35)`

  const root = document.documentElement
  root.style.setProperty('--bg-main', `rgb(${r},${g},${b})`)
  root.style.setProperty('--bg-alt',  `rgb(${r2},${g2},${b2})`)
  root.style.setProperty('--panel-bg', `rgba(${r},${g},${b},${dark ? '0.75' : '0.55'})`)
  root.style.setProperty('--panel-border', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)')
  root.style.setProperty('--input-bg', dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')
  root.style.setProperty('--text', text)
  root.style.setProperty('--text-dim', textDim)
  root.style.setProperty('--green', green)
  root.style.setProperty('--green-dark', greenDk)
  root.style.setProperty('--green-hover', greenHov)
  root.style.setProperty('--gold', gold)
  root.style.setProperty('--suggestions-bg', dark ? 'rgba(15,23,42,0.97)' : 'rgba(248,250,252,0.98)')

  root.style.setProperty('--accent', accentHex)
  root.style.setProperty('--accent-glow', accentGlow)
  root.style.setProperty('--accent-hover', accentHover)
  root.style.setProperty('--accent-bg', accentBg)
  root.style.setProperty('--accent-border', accentBorder)
  root.style.setProperty('--accent-text', dark ? '#ffffff' : '#ffffff')
}

const DEFAULT_COLOR = '#1a3550'
const DEFAULT_ACCENT = '#89b8ff'

export const PRESETS = [
  { bg: '#1a3550', accent: '#89b8ff', label: 'Default' },
  { bg: '#e8edf2', accent: '#7b96d1', label: 'Light' },
  { bg: '#403b3b', accent: '#000000', label: 'Dark' },
  { bg: '#172d6e', accent: '#60c0f8', label: 'Blue' },
  { bg: '#053426', accent: '#008a57', label: 'Green' },
  { bg: '#6b1a1a', accent: '#bd5800', label: 'Red' },
  { bg: '#4d3300', accent: '#3d2700', label: 'Brown' },
  { bg: '#280f57', accent: '#957aff', label: 'Purple' },
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