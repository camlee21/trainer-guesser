
import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'

const MAX_LENGTHS = {
  submitterName: 20,
  submitterLink: 100,
  trainerName: 40,
  game: 30,
  fightDetails: 50,
}

export default function TrainerSuggestions() {
  const [formData, setFormData] = useState({
    submitterName: '',
    submitterLink: '',
    trainerName: '',
    game: '',
    fightDetails: '',
    botcheck: '',
  })
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef(null)

  function handleChange(field) {
    return (e) => {
      const value = e.target.value.slice(0, MAX_LENGTHS[field] ?? undefined)
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (formData.botcheck) {
      setStatus({ type: 'success', message: 'Thanks for the suggestion!' })
      return
    }

    if (!formData.submitterName.trim()) {
      setStatus({ type: 'error', message: 'Please leave a name for credit.' })
      return
    }

    if (!formData.trainerName.trim() || !formData.game.trim()) {
      setStatus({ type: 'error', message: 'Please fill in the trainer name and game.' })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      const payload = new FormData()
      payload.append('access_key', import.meta.env.VITE_WEB3FORMS_KEY)
      payload.append('subject', 'New Trainer Suggestion')
      payload.append('Submitted By', formData.submitterName)
      payload.append('Link', formData.submitterLink || 'Not provided')
      payload.append('Trainer Name', formData.trainerName)
      payload.append('Game', formData.game)
      payload.append('Specific Fight Details', formData.fightDetails || 'Latest / most iconic fight')

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload,
      })

      const result = await response.json()

      if (result.success) {
        setStatus({ type: 'success', message: 'Thanks! Your suggestion has been sent.' })
        setFormData({
          submitterName: '',
          submitterLink: '',
          trainerName: '',
          game: '',
          fightDetails: '',
          botcheck: '',
        })
      } else {
        setStatus({ type: 'error', message: result.message || 'Something went wrong. Please try again.' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSuccess = status?.type === 'success'

  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">
        ← Back to Home
      </Link>
      <h2 className="static-page-title">Trainer Suggestions</h2>
      <p className="game-description" style={{ margin: '0 auto' }}>
        Got a trainer you'd like to see in Daily mode? Fill out the form below, or hit me up on{' '}
        <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
          Twitter
        </a>{' '}
        directly, and you can be credited here! FYI, only main-series trainers are allowed - if you have any suggestions for Infinite mode, please contact my Twitter instead!
      </p>

      {isSuccess ? (
        <div className="suggestion-success-block">
          <div className="form-status success">
            Thanks! Your suggestion has been sent.
          </div>
          <button
            onClick={() => setStatus(null)}
            className="back-btn"
            style={{ alignSelf: 'center' }}
          >
            Submit another suggestion
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="suggestion-form">
          <input
            type="text"
            name="botcheck"
            value={formData.botcheck}
            onChange={handleChange('botcheck')}
            className="form-honeypot"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="form-group">
            <label className="form-label">Your Name / Username</label>
            <input
              type="text"
              value={formData.submitterName}
              onChange={handleChange('submitterName')}
              placeholder="How should I credit you?"
              className="search-input"
              maxLength={MAX_LENGTHS.submitterName}
              required
            />
            <span className="char-counter">{formData.submitterName.length}/{MAX_LENGTHS.submitterName}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Twitter / Bluesky Link (optional)</label>
            <input
              type="text"
              value={formData.submitterLink}
              onChange={handleChange('submitterLink')}
              placeholder="https://..."
              className="search-input"
              maxLength={MAX_LENGTHS.submitterLink}
            />
            <span className="char-counter">{formData.submitterLink.length}/{MAX_LENGTHS.submitterLink}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Trainer Name</label>
            <input
              type="text"
              value={formData.trainerName}
              onChange={handleChange('trainerName')}
              placeholder="e.g. Cynthia"
              className="search-input"
              maxLength={MAX_LENGTHS.trainerName}
              required
            />
            <span className="char-counter">{formData.trainerName.length}/{MAX_LENGTHS.trainerName}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Game</label>
            <input
              type="text"
              value={formData.game}
              onChange={handleChange('game')}
              placeholder="e.g. Platinum"
              className="search-input"
              maxLength={MAX_LENGTHS.game}
              required
            />
            <span className="char-counter">{formData.game.length}/{MAX_LENGTHS.game}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Specific Fight (optional)</label>
            <textarea
              value={formData.fightDetails}
              onChange={handleChange('fightDetails')}
              placeholder="Want a specific fight, or one of my choosing?"
              className="form-textarea"
              maxLength={MAX_LENGTHS.fightDetails}
            />
            <span className="char-counter">{formData.fightDetails.length}/{MAX_LENGTHS.fightDetails}</span>
          </div>

          {status?.type === 'error' && (
            <div className="form-status error">
              {status.message}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className={`primary-btn ${isSubmitting ? 'disabled' : ''}`}>
            {isSubmitting ? 'Sending...' : 'Submit Suggestion'}
          </button>
        </form>
      )}
    </main>
  )
}