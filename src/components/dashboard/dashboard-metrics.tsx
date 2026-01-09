'use client'

/**
 * Dashboard Metrics Component
 * Displays key metrics and recent calls for the dashboard
 */

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Users, Calendar, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRealtimeCalls } from '@/lib/hooks/use-realtime'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DashboardMetrics() {
  const [tenantId, setTenantId] = useState<string | undefined>()
  const { data: metrics, isLoading } = trpc.analytics.getDashboardMetrics.useQuery()

  // Get tenant ID from Supabase auth
  useEffect(() => {
    const getTenantId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', user.id)
          .single()

        if (data) {
          setTenantId(data.tenant_id)
        }
      }
    }

    getTenantId()
  }, [])

  // Enable realtime updates for calls
  useRealtimeCalls(tenantId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Calls Today',
      value: metrics?.callsToday.toString() || '0',
      icon: Phone,
      description: metrics?.callsToday === 1 ? '1 call today' : `${metrics?.callsToday || 0} calls today`,
    },
    {
      title: 'Total Leads',
      value: metrics?.totalLeads.toString() || '0',
      icon: Users,
      description: 'All time',
    },
    {
      title: 'Total Bookings',
      value: metrics?.totalBookings.toString() || '0',
      icon: Calendar,
      description: 'All time',
    },
    {
      title: 'Conversion Rate',
      value: `${metrics?.conversionRate || 0}%`,
      icon: TrendingUp,
      description: 'Leads to bookings',
    },
  ]

  return (
    <div className="space-y-6">
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

      {/* Recent Calls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Calls</CardTitle>
          <Link href="/dashboard/calls">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!metrics?.recentCalls || metrics.recentCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No calls yet</p>
              <p className="text-sm mt-1">Calls will appear here when customers call your VAPI number</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/dashboard/calls/${call.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        call.outcome === 'booking_made' ? 'bg-green-500' :
                        call.outcome === 'quote_given' ? 'bg-blue-500' :
                        call.outcome === 'no_interest' ? 'bg-gray-400' :
                        call.outcome === 'error' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {call.caller_phone_number || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {call.created_at ? formatDistanceToNow(new Date(call.created_at), { addSuffix: true }) : 'Unknown'}
                          </span>
                          {call.duration_seconds && (
                            <span>{Math.floor(call.duration_seconds / 60)}:{String(call.duration_seconds % 60).padStart(2, '0')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        call.booking_made ? 'text-green-600' :
                        call.lead_captured ? 'text-blue-600' :
                        'text-muted-foreground'
                      }`}>
                        {call.booking_made ? 'Booked' :
                         call.lead_captured ? 'Lead' :
                         call.outcome === 'error' ? 'Error' :
                         'Ended'}
                      </div>
                      {call.quote_amount && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <DollarSign className="h-3 w-3" />
                          {parseFloat(call.quote_amount.toString()).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
