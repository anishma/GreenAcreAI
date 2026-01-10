'use client'

/**
 * Bookings Page
 * View and manage all bookings
 */

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Phone, MapPin, DollarSign, Clock } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

export default function BookingsPage() {
  const [filter, setFilter] = useState<string>('upcoming')
  const { data: response, isLoading } = trpc.booking.getAll.useQuery()

  const bookings = response?.bookings || []

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.scheduled_at)

    if (filter === 'upcoming') {
      return isFuture(bookingDate) && booking.status === 'confirmed'
    } else if (filter === 'completed') {
      return isPast(bookingDate) || booking.status === 'completed'
    } else if (filter === 'cancelled') {
      return booking.status === 'cancelled'
    }
    return true
  }) || []

  // Sort by date (upcoming first, then past)
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Bookings</h2>
        <p className="text-muted-foreground mt-1">
          Manage all scheduled appointments
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter bookings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No bookings found</p>
              <p className="text-sm mt-1">
                {filter !== 'all'
                  ? `No ${filter} bookings`
                  : 'Bookings will appear here when customers schedule appointments'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedBookings.map((booking) => {
            const bookingDate = new Date(booking.scheduled_at)
            const isUpcoming = isFuture(bookingDate)

            return (
              <Card key={booking.id} className={isUpcoming ? 'border-primary/50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">
                      {booking.customer_name || 'Unknown Customer'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          booking.status === 'confirmed'
                            ? 'default'
                            : booking.status === 'completed'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                      {isUpcoming && (
                        <Badge variant="outline" className="bg-primary/10">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <span className="font-medium">
                        {format(bookingDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(bookingDate, 'h:mm a')}
                      </div>
                    </div>
                  </div>

                  {/* Customer Phone */}
                  {booking.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{booking.customer_phone}</span>
                    </div>
                  )}

                  {/* Property Address */}
                  {booking.property_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        {booking.property_address}
                        {booking.property_city && `, ${booking.property_city}`}
                        {booking.property_state && `, ${booking.property_state}`}
                        {booking.property_zip && ` ${booking.property_zip}`}
                      </span>
                    </div>
                  )}

                  {/* Service Type & Price */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {booking.service_type && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Service:</span>{' '}
                        <span className="font-medium capitalize">
                          {booking.service_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {booking.estimated_price && (
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-green-600">
                          ${parseFloat(booking.estimated_price.toString()).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="text-sm text-muted-foreground pt-3 border-t">
                      <p className="line-clamp-2">{booking.notes}</p>
                    </div>
                  )}

                  {/* Google Calendar Link */}
                  {booking.google_calendar_event_id && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Synced to Google Calendar</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
