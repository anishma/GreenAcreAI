// Type aliases for reusable union types

// Single shared frequency type - used for both offered services and customer selection
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'one-time'

// Conversation stage tracking (state values, not node names)
export type ConversationStage =
  | 'greeting'
  | 'intent_routing' // NEW: Classify user intent before forcing booking flow
  | 'address_collection'
  | 'property_lookup'
  | 'frequency_collection'
  | 'quoting'
  | 'booking'
  | 'closing'
  | 'WAITING_FOR_ADDRESS'
  | 'WAITING_FOR_FREQUENCY'
  | 'WAITING_FOR_BOOKING_DECISION'
  | 'END'

export interface ConversationState {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  tenant_id: string
  call_id: string

  // Customer info
  customer_phone?: string
  customer_name?: string
  customer_address?: {
    street: string
    city: string
    state: string
    zip: string
  }

  // Property data
  property_data?: {
    lot_size_sqft: number
    parcel_id: string
  }

  // Service preferences
  preferred_frequency?: Frequency

  // Quote
  quote?: {
    price: number
    frequency: Frequency
    service_inclusions: string[]
  }

  // Booking
  chosen_time?: string
  booking?: {
    scheduled_at: string
    calendar_event_id: string
  }

  // State tracking
  stage: ConversationStage
  attempts: {
    address_extraction: number
    property_lookup: number
  }
}
