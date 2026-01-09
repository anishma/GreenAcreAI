/**
 * Dashboard Page
 *
 * Main dashboard overview with stats and recent activity.
 */

import { createClient } from '@/lib/supabase/server'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's tenant information (only if authenticated)
  let dbUser = null
  if (user) {
    const result = await supabase
      .from('users')
      .select('tenant_id, email, role, full_name')
      .eq('auth_user_id', user.id)
      .single()
    dbUser = result.data
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          {dbUser?.full_name || user?.email || 'Welcome to GreenAcre AI'}
        </p>
      </div>

      {/* Metrics */}
      <DashboardMetrics />
    </div>
  )
}
