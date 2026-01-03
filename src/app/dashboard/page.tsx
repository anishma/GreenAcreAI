/**
 * Dashboard Page
 *
 * Protected dashboard page - tests authentication and middleware protection.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's tenant information
  const { data: dbUser } = await supabase
    .from('users')
    .select('tenant_id, email, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Welcome to GreenAcre AI
        </p>
      </div>

      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Authentication Status
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <span style={{ fontWeight: '500', color: '#374151' }}>Auth User ID:</span>
            <span style={{ marginLeft: '8px', color: '#6b7280', fontFamily: 'monospace' }}>
              {user.id}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: '500', color: '#374151' }}>Email:</span>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>
              {user.email}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: '500', color: '#374151' }}>Database User:</span>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>
              {dbUser ? `Found (${dbUser.email})` : 'Not found - needs onboarding'}
            </span>
          </div>
          {dbUser && (
            <>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Tenant ID:</span>
                <span style={{ marginLeft: '8px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {dbUser.tenant_id || 'No tenant assigned'}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Role:</span>
                <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                  {dbUser.role}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{
        padding: '24px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
          ✅ OAuth Flow Test Successful!
        </h3>
        <p style={{ color: '#15803d', fontSize: '14px' }}>
          You have successfully authenticated with Google OAuth and the middleware
          protected this route correctly.
        </p>
      </div>

      <form action="/api/auth/signout" method="POST" style={{ marginTop: '24px' }}>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}
