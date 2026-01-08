/**
 * Dashboard Page
 *
 * Main dashboard overview with stats and recent activity.
 */

import { createClient } from '@/lib/supabase/server'
// import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Users, Calendar, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TEMPORARY: Auth is disabled for UI testing
  // if (!user) {
  //   redirect('/login')
  // }

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

  // Mock stats - will be replaced with real data later
  const stats = [
    {
      title: 'Total Calls',
      value: '0',
      icon: Phone,
      description: 'No calls yet',
    },
    {
      title: 'Active Leads',
      value: '0',
      icon: Users,
      description: 'No leads yet',
    },
    {
      title: 'Bookings',
      value: '0',
      icon: Calendar,
      description: 'No bookings yet',
    },
    {
      title: 'Conversion Rate',
      value: '0%',
      icon: TrendingUp,
      description: 'N/A',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold">Welcome back!</h2>
        <p className="text-muted-foreground mt-1">
          {dbUser?.full_name || user?.email || 'Guest (Auth Disabled for Testing)'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-muted-foreground">{user?.email || 'Not authenticated'}</p>
            </div>
            <div>
              <span className="font-medium">Role:</span>
              <p className="text-muted-foreground">{dbUser?.role || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Tenant ID:</span>
              <p className="text-muted-foreground font-mono text-xs">
                {dbUser?.tenant_id || 'No tenant assigned'}
              </p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <p className="text-muted-foreground">
                {user ? (dbUser ? 'Active' : 'Needs onboarding') : 'Testing mode (no auth)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {!dbUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete your tenant onboarding to start using GreenAcre AI.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
