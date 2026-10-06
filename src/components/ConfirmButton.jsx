import { useState, useEffect } from 'react'

// A button for actions that can't be taken back (Pass, Show answer, Restart route).
// The first tap arms it and swaps in `confirmLabel`; a second tap within 3 seconds runs `onConfirm`.
export default function ConfirmButton({ className = '', confirmLabel, onConfirm, children }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  function handleClick() {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    onConfirm()
  }

  return (
    <button
      type="button"
      className={`${className} ${armed ? 'is-armed' : ''}`}
      onClick={handleClick}
      onBlur={() => setArmed(false)}
    >
      <span aria-live="polite">{armed ? confirmLabel : children}</span>
    </button>
  )
}
