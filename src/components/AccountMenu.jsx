import { useState, useRef, useEffect } from 'react'

// Signed in: the right-most key shows who you are, and Sign Out lives one tap deeper in its menu
export default function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const buttonRef = useRef(null)

  const fullName = user.user_metadata?.full_name
  const firstName = fullName?.split(' ')[0] ?? user.email.split('@')[0]

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    // Esc closes the menu and puts focus back on the key that opened it
    function onKey(e) {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="account">
      <button
        ref={buttonRef}
        type="button"
        className="topbar-btn account-btn"
        aria-expanded={open}
        aria-label={`Account: ${firstName}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="account-initial" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
        <span className="topbar-btn-label account-name">{firstName}</span>
        <svg className="account-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="account-menu">
          <span className="account-menu-label">Signed in as</span>
          <span className="account-menu-name">{fullName ?? firstName}</span>
          <span className="account-menu-email">{user.email}</span>
          <button type="button" className="back-btn account-signout" onClick={() => { setOpen(false); onSignOut() }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
