'use client'

/**
 * Analytics Page
 * Charts and metrics for call performance
 *
 * Data Source: analytics_daily table
 *
 * How Analytics are Tracked:
 * 1. The analytics_daily table stores aggregated daily metrics per tenant
 * 2. Metrics include:
 *    - Total Calls: Count of all calls made on that day
 *    - Successful/Failed Calls: Call completion status
 *    - Bookings Made: Number of bookings created from calls
 *    - Leads Captured: Number of leads generated
 *    - Total Cost: VAPI usage cost for the day (from call costs)
 *    - Avg Cost Per Call: Average VAPI cost per call
 *
 * 3. Data Population (Not Yet Implemented):
 *    - Should be populated by a daily cron job or batch process
 *    - Aggregates data from the calls, bookings, and leads tables
 *    - Calculates costs based on VAPI call duration and pricing
 *
 * 4. Current State:
 *    - Table exists but is empty (no background job running yet)
 *    - Analytics page will show "No data available" until populated
 *    - This is a Phase 2 feature - MVP shows placeholder UI
 */

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Phone, Calendar } from 'lucide-react'
import { useState } from 'react'
import { subDays, format } from 'date-fns'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data: summary, isLoading } = trpc.analytics.getSummary.useQuery({
    days,
  })

  const { data: daily } = trpc.analytics.getDaily.useQuery({
    startDate: subDays(new Date(), days).toISOString(),
    endDate: new Date().toISOString(),
    limit: days,
  })

  // Prepare data for charts
  const callsOverTime = daily?.analytics
    .slice()
    .reverse()
    .map((d: NonNullable<typeof daily>['analytics'][number]) => ({
      date: format(new Date(d.date), 'MMM d'),
      calls: d.total_calls,
      successful: d.successful_calls,
      failed: d.failed_calls,
    })) || []

  const outcomeData = summary
    ? [
        { name: 'Bookings', value: summary.bookingsMade, color: '#22c55e' },
        { name: 'Quotes Given', value: summary.quotesGiven - summary.bookingsMade, color: '#3b82f6' },
        { name: 'No Interest', value: summary.successfulCalls - summary.quotesGiven, color: '#9ca3af' },
        { name: 'Failed', value: summary.failedCalls, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : []

  const conversionRate = summary?.leadsCaptured
    ? ((summary.bookingsMade / summary.leadsCaptured) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Performance metrics and insights
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              days === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {isLoading ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Calls
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalCalls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.successfulCalls || 0} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bookings Made
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary?.bookingsMade || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {conversionRate}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads Captured
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary?.leadsCaptured || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary?.totalCost.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                VAPI usage
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Calls Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {callsOverTime.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Phone className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={callsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Total Calls"
                  />
                  <Line
                    type="monotone"
                    dataKey="successful"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Successful"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || summary.totalCalls === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total Calls */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Calls</span>
                  <span className="font-semibold">{summary.totalCalls}</span>
                </div>
                <div className="h-8 bg-purple-500 rounded" style={{ width: '100%' }} />
              </div>

              {/* Successful Calls */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Successful Calls</span>
                  <span className="font-semibold">
                    {summary.successfulCalls} ({((summary.successfulCalls / summary.totalCalls) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div
                  className="h-8 bg-green-500 rounded"
                  style={{ width: `${(summary.successfulCalls / summary.totalCalls) * 100}%` }}
                />
              </div>

              {/* Quotes Given */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Quotes Given</span>
                  <span className="font-semibold">
                    {summary.quotesGiven} ({((summary.quotesGiven / summary.totalCalls) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div
                  className="h-8 bg-blue-500 rounded"
                  style={{ width: `${(summary.quotesGiven / summary.totalCalls) * 100}%` }}
                />
              </div>

              {/* Bookings Made */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Bookings Made</span>
                  <span className="font-semibold">
                    {summary.bookingsMade} ({((summary.bookingsMade / summary.totalCalls) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div
                  className="h-8 bg-emerald-600 rounded"
                  style={{ width: `${(summary.bookingsMade / summary.totalCalls) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
