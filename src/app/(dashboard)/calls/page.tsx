/**
 * Calls Page
 * List of all calls with filters and search
 */

'use client'

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Clock, DollarSign, Calendar } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function CallsPage() {
  const [search, setSearch] = useState('')
  const { data: response, isLoading } = trpc.call.getAll.useQuery()

  const calls = response?.calls || []

  // Filter calls by phone number search
  const filteredCalls = calls.filter((call) =>
    call.caller_phone_number?.includes(search) ||
    call.phone_number_called?.includes(search)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Calls</h2>
        <p className="text-muted-foreground mt-1">
          View and manage all incoming calls
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Calls ({filteredCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No calls found</p>
              <p className="text-sm mt-1">
                {search ? 'Try a different search term' : 'Calls will appear here when customers call'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/dashboard/calls/${call.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        call.outcome === 'booking_made' ? 'bg-green-500' :
                        call.outcome === 'quote_given' ? 'bg-blue-500' :
                        call.outcome === 'no_interest' ? 'bg-gray-400' :
                        call.outcome === 'error' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />

                      {/* Call Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">
                              {call.caller_phone_number || 'Unknown'}
                            </span>
                          </div>
                          {call.created_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(call.created_at), 'MMM d, yyyy')}
                            </div>
                          )}
                          {call.created_at && (
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {call.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(call.duration_seconds / 60)}:{String(call.duration_seconds % 60).padStart(2, '0')}
                            </span>
                          )}
                          <span className={`font-medium ${
                            call.booking_made ? 'text-green-600' :
                            call.lead_captured ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {call.booking_made ? 'Booking Made' :
                             call.lead_captured ? 'Lead Captured' :
                             call.outcome === 'error' ? 'Error' :
                             call.outcome === 'no_interest' ? 'No Interest' :
                             'Completed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quote Amount */}
                    {call.quote_amount && (
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {parseFloat(call.quote_amount.toString()).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Quote</p>
                      </div>
                    )}
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
