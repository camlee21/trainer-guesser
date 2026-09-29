import { useState, useEffect } from 'react'

// Floating buttons for long, growing pages (Infinite rounds, Connections routes)
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-top-btn ${visible ? 'visible' : ''}`}
      title="Back to top"
      aria-label="Scroll to top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}

export function ScrollToBottomButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      const scrolledFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      setVisible(scrolledFromBottom > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToBottom}
      className={`scroll-bottom-btn ${visible ? 'visible' : ''}`}
      title="Scroll to bottom"
      aria-label="Scroll to bottom"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  )
}
