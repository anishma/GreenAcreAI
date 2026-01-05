import { StateGraph, END } from '@langchain/langgraph'
import { ConversationState } from './state'
import { greetingNode } from './nodes/greeting'
import { addressExtractionNode } from './nodes/address-extraction'
import { propertyLookupNode } from './nodes/property-lookup'
import { quoteCalculationNode } from './nodes/quote-calculation'
import { bookingNode } from './nodes/booking'
import { closingNode } from './nodes/closing'

// Define the graph
const workflow = new StateGraph<ConversationState>({
  channels: {
    messages: {
      value: (prev: any[], next: any[]) => next,
      default: () => [],
    },
    tenant_id: {
      value: (prev: string, next: string) => next ?? prev,
      default: () => '',
    },
    call_id: {
      value: (prev: string, next: string) => next ?? prev,
      default: () => '',
    },
    customer_phone: {
      value: (prev: string | undefined, next: string | undefined) =>
        next ?? prev,
      default: () => undefined,
    },
    customer_name: {
      value: (prev: string | undefined, next: string | undefined) =>
        next ?? prev,
      default: () => undefined,
    },
    customer_address: {
      value: (
        prev:
          | { street: string; city: string; state: string; zip: string }
          | undefined,
        next:
          | { street: string; city: string; state: string; zip: string }
          | undefined
      ) => next ?? prev,
      default: () => undefined,
    },
    property_data: {
      value: (
        prev: { lot_size_sqft: number; parcel_id: string } | undefined,
        next: { lot_size_sqft: number; parcel_id: string } | undefined
      ) => next ?? prev,
      default: () => undefined,
    },
    quote: {
      value: (
        prev:
          | {
              price: number
              frequency: 'weekly' | 'biweekly'
              service_inclusions: string[]
            }
          | undefined,
        next:
          | {
              price: number
              frequency: 'weekly' | 'biweekly'
              service_inclusions: string[]
            }
          | undefined
      ) => next ?? prev,
      default: () => undefined,
    },
    chosen_time: {
      value: (prev: string | undefined, next: string | undefined) =>
        next ?? prev,
      default: () => undefined,
    },
    booking: {
      value: (
        prev:
          | { scheduled_at: string; calendar_event_id: string }
          | undefined,
        next: { scheduled_at: string; calendar_event_id: string } | undefined
      ) => next ?? prev,
      default: () => undefined,
    },
    stage: {
      value: (prev: string, next: string) => next ?? prev,
      default: () => 'greeting',
    },
    attempts: {
      value: (
        prev: { address_extraction: number; property_lookup: number },
        next: { address_extraction: number; property_lookup: number }
      ) => next ?? prev,
      default: () => ({ address_extraction: 0, property_lookup: 0 }),
    },
  },
})

// Add nodes
workflow.addNode('greeting', greetingNode)
workflow.addNode('address_extraction', addressExtractionNode)
workflow.addNode('property_lookup', propertyLookupNode)
workflow.addNode('quote_calculation', quoteCalculationNode)
workflow.addNode('booking', bookingNode)
workflow.addNode('closing', closingNode)

// Conditional routing function
function routeBasedOnStage(state: ConversationState): string {
  switch (state.stage) {
    case 'greeting':
      return 'address_extraction'
    case 'address_collection':
      return 'address_extraction'
    case 'property_lookup':
      return 'property_lookup'
    case 'quoting':
      return 'quote_calculation'
    case 'booking':
      return 'booking'
    case 'closing':
      return 'closing'
    default:
      return END
  }
}

// Set entry point
workflow.setEntryPoint('greeting')

// Add conditional edges from each node
workflow.addConditionalEdges('greeting', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('address_extraction', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('property_lookup', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('quote_calculation', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('booking', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('closing', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking: 'booking',
  closing: 'closing',
  [END]: END,
})

// Compile the graph
export const conversationGraph = workflow.compile()
