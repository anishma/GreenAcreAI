/**
 * MCP Tool Types
 * TypeScript interfaces for all MCP tool inputs and outputs
 */

// Property Lookup Tool Types
export interface LookupPropertyInput {
  street: string
  city: string
  state: string
  zip: string
}

export interface LookupPropertyOutput {
  lot_size_sqft: number
  parcel_id: string
  address: string
  zoning: string
}

// Calendar Tool Types
export interface GetAvailableSlotsInput {
  tenant_id: string
  start_date: string
  end_date: string
}

export interface GetAvailableSlotsOutput {
  available_slots: Array<{
    start: string
    end: string
  }>
}

export interface BookAppointmentInput {
  tenant_id: string
  start_time: string
  customer_name: string
  customer_phone: string
  property_address: string
  estimated_price: number
}

export interface BookAppointmentOutput {
  calendar_event_id: string
  scheduled_at: string
}

export interface CancelAppointmentInput {
  tenant_id: string
  calendar_event_id: string
}

export interface CancelAppointmentOutput {
  success: boolean
  message: string
}

// Business Logic Tool Types
export interface CalculateQuoteInput {
  tenant_id: string
  lot_size_sqft: number
  frequency?: 'weekly' | 'biweekly'
}

export interface CalculateQuoteOutput {
  price: number
  frequency: 'weekly' | 'biweekly'
  service_inclusions: string[]
  pricing_type: string
  tier_range: string
}

export interface ValidateServiceAreaInput {
  tenant_id: string
  zip: string
}

export interface ValidateServiceAreaOutput {
  in_service_area: boolean
}

export interface GetGenericPriceRangeInput {
  tenant_id: string
}

export interface GetGenericPriceRangeOutput {
  weekly: {
    min: number
    max: number
    range: string
  }
  biweekly: {
    min: number
    max: number
    range: string
  }
  message: string
}

// Unified MCP Tool Call Types
export type MCPToolName =
  | 'lookup_property'
  | 'get_available_slots'
  | 'book_appointment'
  | 'cancel_appointment'
  | 'calculate_quote'
  | 'validate_service_area'
  | 'get_generic_price_range'

export type MCPServerName = 'property-lookup' | 'calendar' | 'business-logic'

export interface MCPToolCall<TInput = any, TOutput = any> {
  server: MCPServerName
  tool: MCPToolName
  input: TInput
  output?: TOutput
}
