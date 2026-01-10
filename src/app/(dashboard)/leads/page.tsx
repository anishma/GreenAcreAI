'use client'

/**
 * Leads Page
 * Manage all leads with status updates and search
 */

import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Phone, MapPin, DollarSign, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: response, isLoading } = trpc.lead.getAll.useQuery()

  const leads = response?.leads || []

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone_number?.includes(search) ||
      lead.address?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Leads</h2>
        <p className="text-muted-foreground mt-1">
          Manage and track all your leads
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name, phone, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
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
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No leads found</p>
              <p className="text-sm mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Leads will appear here when customers show interest'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {lead.name || 'Unknown Customer'}
                  </CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      lead.status === 'new'
                        ? 'bg-blue-100 text-blue-700'
                        : lead.status === 'contacted'
                        ? 'bg-yellow-100 text-yellow-700'
                        : lead.status === 'quoted'
                        ? 'bg-purple-100 text-purple-700'
                        : lead.status === 'booked'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{lead.phone_number}</span>
                </div>

                {/* Address */}
                {lead.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">
                      {lead.address}
                      {lead.city && `, ${lead.city}`}
                      {lead.state && `, ${lead.state}`}
                      {lead.zip && ` ${lead.zip}`}
                    </span>
                  </div>
                )}

                {/* Quote */}
                {lead.quote_amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-green-600">
                      ${parseFloat(lead.quote_amount.toString()).toFixed(2)}
                    </span>
                    {lead.quote_frequency && (
                      <span className="text-muted-foreground">/ {lead.quote_frequency}</span>
                    )}
                  </div>
                )}

                {/* Created Date */}
                {lead.created_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                    <p className="line-clamp-2">{lead.notes}</p>
                  </div>
                )}

                {/* Lot Size */}
                {lead.lot_size_sqft && (
                  <div className="text-sm text-muted-foreground">
                    Lot: {lead.lot_size_sqft.toLocaleString()} sqft
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
