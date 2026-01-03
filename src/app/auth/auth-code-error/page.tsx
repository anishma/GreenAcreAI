/**
 * Auth Code Error Page
 *
 * Displayed when OAuth callback fails
 */

export default function AuthCodeErrorPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        backgroundColor: '#fef2f2'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#991b1b' }}>
          Authentication Error
        </h1>
        <p style={{ marginBottom: '24px', color: '#7f1d1d' }}>
          There was an error during the authentication process. This could be due to:
        </p>
        <ul style={{ marginBottom: '24px', color: '#7f1d1d', paddingLeft: '20px' }}>
          <li>Invalid or expired authentication code</li>
          <li>Configuration issue with OAuth provider</li>
          <li>Network connectivity problem</li>
        </ul>
        <a
          href="/login"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            textAlign: 'center',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Try Again
        </a>
      </div>
    </div>
  )
}
