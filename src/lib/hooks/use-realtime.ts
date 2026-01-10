'use client'

/**
 * Supabase Realtime Hooks
 * Subscribe to database changes for real-time updates
 */

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

/**
 * Subscribe to new calls for real-time dashboard updates
 */
export function useRealtimeCalls(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    const channel = supabase
      .channel('calls-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] New call received:', payload)

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['analytics', 'getDashboardMetrics'] })
          queryClient.invalidateQueries({ queryKey: ['call', 'list'] })

          // Show toast notification
          toast({
            title: 'New Call',
            description: 'A new call has been received',
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Call updated:', payload)

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['analytics', 'getDashboardMetrics'] })
          queryClient.invalidateQueries({ queryKey: ['call', 'list'] })

          // Show toast for booking or lead
          const call = payload.new as any
          if (call.booking_made) {
            toast({
              title: 'Booking Made! 🎉',
              description: `New booking from ${call.caller_phone_number || 'customer'}`,
            })
          } else if (call.lead_captured) {
            toast({
              title: 'Lead Captured',
              description: `New lead from ${call.caller_phone_number || 'customer'}`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, queryClient])
}

/**
 * Subscribe to new leads for real-time updates
 */
export function useRealtimeLeads(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] New lead:', payload)

          // Invalidate lead queries
          queryClient.invalidateQueries({ queryKey: ['lead', 'list'] })
          queryClient.invalidateQueries({ queryKey: ['analytics', 'getDashboardMetrics'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Lead updated:', payload)

          // Invalidate lead queries
          queryClient.invalidateQueries({ queryKey: ['lead', 'list'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, queryClient])
}

/**
 * Subscribe to new bookings for real-time updates
 */
export function useRealtimeBookings(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] New booking:', payload)

          // Invalidate booking queries
          queryClient.invalidateQueries({ queryKey: ['booking', 'list'] })
          queryClient.invalidateQueries({ queryKey: ['analytics', 'getDashboardMetrics'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Realtime] Booking updated:', payload)

          // Invalidate booking queries
          queryClient.invalidateQueries({ queryKey: ['booking', 'list'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, queryClient])
}

/**
 * Subscribe to all relevant changes for a comprehensive real-time experience
 */
export function useRealtimeUpdates(tenantId: string | undefined) {
  useRealtimeCalls(tenantId)
  useRealtimeLeads(tenantId)
  useRealtimeBookings(tenantId)
}
