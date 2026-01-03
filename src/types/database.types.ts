/**
 * Database Types
 *
 * This file contains TypeScript types for the database schema.
 * Generated from Prisma schema and Supabase database.
 *
 * Note: For production, regenerate these types using:
 * npx supabase gen types typescript --project-id <project-id>
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_name: string
          owner_name: string
          email: string
          phone: string | null
          service_areas: Json
          pricing_tiers: Json
          allows_generic_quotes: boolean
          generic_quote_disclaimer: string | null
          google_calendar_refresh_token: string | null
          google_calendar_access_token: string | null
          google_calendar_token_expires_at: string | null
          calendar_id: string | null
          phone_number: string | null
          phone_number_sid: string | null
          vapi_agent_id: string | null
          vapi_phone_number_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
          timezone: string
          business_hours: Json
          notification_preferences: Json
          status: string
          onboarding_completed: boolean
          onboarding_step: string
          test_call_completed: boolean
          test_call_completed_at: string | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          email: string
          role: string
          auth_user_id: string | null
          full_name: string | null
          avatar_url: string | null
          status: string
          last_login_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      calls: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          vapi_call_id: string | null
          phone_number_called: string | null
          caller_phone_number: string | null
          started_at: string | null
          ended_at: string | null
          duration_seconds: number | null
          status: string | null
          end_reason: string | null
          transcript: Json | null
          transcript_text: string | null
          summary: string | null
          outcome: string | null
          quote_amount: number | null
          booking_made: boolean
          lead_captured: boolean
          recording_url: string | null
          recording_duration: number | null
          cost_total: number | null
          cost_breakdown: Json | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['calls']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['calls']['Insert']>
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          call_id: string | null
          phone_number: string
          email: string | null
          name: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          lot_size_sqft: number | null
          parcel_id: string | null
          quote_amount: number | null
          quote_frequency: string | null
          service_type: string
          status: string
          source: string
          follow_up_needed: boolean
          follow_up_at: string | null
          notes: string | null
          metadata: Json
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          call_id: string | null
          lead_id: string | null
          scheduled_at: string
          duration_minutes: number
          service_type: string
          estimated_price: number | null
          customer_name: string | null
          customer_phone: string | null
          customer_email: string | null
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_zip: string | null
          google_calendar_event_id: string | null
          status: string
          cancellation_reason: string | null
          confirmation_sent: boolean
          reminder_sent: boolean
          metadata: Json
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          call_id: string | null
          booking_id: string | null
          type: string
          template: string | null
          recipient: string
          subject: string | null
          body: string
          status: string
          provider: string | null
          provider_message_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      webhooks: {
        Row: {
          id: string
          created_at: string
          source: string
          event_type: string
          payload: Json
          headers: Json | null
          processed: boolean
          processed_at: string | null
          error_message: string | null
          tenant_id: string | null
          call_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['webhooks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['webhooks']['Insert']>
      }
      analytics_daily: {
        Row: {
          id: string
          date: string
          tenant_id: string
          created_at: string
          total_calls: number
          successful_calls: number
          failed_calls: number
          avg_call_duration_seconds: number
          quotes_given: number
          bookings_made: number
          leads_captured: number
          quote_to_booking_rate: number | null
          total_cost: number | null
          avg_cost_per_call: number | null
        }
        Insert: Omit<Database['public']['Tables']['analytics_daily']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['analytics_daily']['Insert']>
      }
      pricing_templates: {
        Row: {
          id: string
          name: string
          tiers: Json
        }
        Insert: Omit<Database['public']['Tables']['pricing_templates']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['pricing_templates']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
