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

  // Quote
  quote?: {
    price: number
    frequency: 'weekly' | 'biweekly'
    service_inclusions: string[]
  }

  // Booking
  chosen_time?: string
  booking?: {
    scheduled_at: string
    calendar_event_id: string
  }

  // State tracking
  stage: 'greeting' | 'address_collection' | 'property_lookup' | 'quoting' | 'booking' | 'closing'
  attempts: {
    address_extraction: number
    property_lookup: number
  }
}
