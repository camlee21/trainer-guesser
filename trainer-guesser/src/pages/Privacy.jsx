
import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <main className="static-page">
      <Link to="/" className="back-btn static-page-back">← Back to Home</Link>
      <h2 className="static-page-title">Privacy Policy</h2>

      <div className="game-description" style={{ textAlign: 'left', maxWidth: '640px', margin: '0 auto' }}>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Last updated: July 2026
        </p>

        <Section title="Overview">
          "Who's That Trainer?" is a free daily Pokémon trainer guessing game. 
          This policy explains what personal data we collect, why
          we collect it, and how it is used. By using the app, you agree to the practices described here.
        </Section>

        <Section title="What data we collect">
            <div style={{ marginBottom: '1rem' }}>
                When you sign in with Google, we receive and store:
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>• Your Google account display name</li>
                <li>• Your Google account email address</li>
                <li>• A unique user ID assigned by our authentication provider</li>
                </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                We also store game data associated with your account:
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>• Your daily guess history and results</li>
                <li>• Your score and streak data</li>
                </ul>
            </div>

            <div>
                If you play without signing in, only your current day's game state is stored locally
                in your browser via localStorage and is never sent to our servers.
            </div>
        </Section>

        <Section title="How we use your data">
          Your data is used solely to:
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li>• Identify your account and keep you signed in</li>
            <li>• Save your game results and display your stats</li>
            <li>• Calculate and maintain your daily streak</li>
            <li>• Sync your progress across devices</li>
          </ul>

          <div style={{ marginTop: '1rem' }}>
            We do not use your data for advertising, profiling, or any purpose beyond operating the app.
          </div>
        </Section>

        <Section title="Data storage and security">
          Your data is stored securely using Supabase, a third-party database provider, on servers
          within Southeast Asia. Supabase's own privacy policy is available at <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
            supabase.com/privacy
        </a>.
          Access to your data is restricted by Row Level Security policies, meaning only you can
          read or modify your own game records. We do not have access to your Google account password.
        </Section>

        

        <Section title="Data sharing">
          We do not sell, rent, or share your personal data with any third parties, advertisers,
          or analytics services. The only third-party services involved in running this website are:
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <li><strong>Google OAuth</strong> - for sign-in only. Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
                privacy policy
            </a> applies to their own handling of your data.</li>
            <li><strong>Supabase</strong> - for database storage. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
                supabase.com/privacy
            </a>.</li>
            <li><strong>Vercel</strong> - for hosting. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
                vercel.com/legal/privacy-policy
            </a>.</li>
            <li><strong>Web3Forms</strong> - for storing user-submitted trainer suggestion forms. See <a href="https://web3forms.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
                web3forms.com/privacy
            </a>.</li>
          </ul>
        </Section>

        <Section title="Contact">
          If you have any questions about this privacy policy or wish to request data deletion,
          please contact us at:{' '}
          <a href="mailto:draglashgames@gmail.com" style={{ color: 'var(--accent)' }}>
            draglashgames@gmail.com
          </a>
          .
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--text-dim)' }}>
        {children}
      </div>
    </div>
  )
}