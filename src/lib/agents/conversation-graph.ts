import { StateGraph, END } from '@langchain/langgraph'
import { ConversationState, Frequency, ConversationStage } from './state'
import { greetingNode } from './nodes/greeting'
import { addressExtractionNode } from './nodes/address-extraction'
import { frequencyCollectionNode } from './nodes/frequency-collection'
import { propertyLookupNode } from './nodes/property-lookup'
import { quoteCalculationNode } from './nodes/quote-calculation'
import { bookingNode } from './nodes/booking'
import { closingNode } from './nodes/closing'

/**
 * Graph node names (workflow identifiers)
 *
 * IMPORTANT: These are separate from ConversationStage values.
 * - Node names: Identify workflow steps (e.g., 'address_extraction')
 * - Stage values: Track conversation state (e.g., 'address_collection', 'WAITING_FOR_ADDRESS')
 *
 * This separation allows nodes to update stage to different values for flow control.
 *
 * Architecture Alignment (Technical Doc Section 4.2.2):
 * - greeting → greet node (initial greeting)
 * - address_extraction → extract_address node (address collection)
 * - property_lookup → lookup_property node (Regrid API call)
 * - frequency_collection → frequency selection node (service frequency)
 * - quote_calculation → calculate_quote node (pricing calculation)
 * - booking_appointment → booking node (calendar integration)
 * - closing → closing node (conversation end)
 *
 * Type Safety Strategy:
 * - LangGraph infers node types progressively as we call .addNode()
 * - We can't pre-declare the workflow type because nodes don't exist at initialization
 * - Instead, we use GraphNode to enforce type safety in the routing function
 * - This catches typos and ensures routing only uses valid node names
 */
type GraphNode =
  | 'greeting'
  | 'address_extraction'
  | 'frequency_collection'
  | 'property_lookup'
  | 'quote_calculation'
  | 'booking_appointment'
  | 'closing'

// Define the graph with explicit node types to enable setEntryPoint and routing
const workflow = new StateGraph<ConversationState, Partial<ConversationState>, GraphNode>({
  channels: {
    messages: {
      value: (prev: any[], next: any[]) => prev.concat(next),
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
    preferred_frequency: {
      value: (prev: Frequency | undefined, next: Frequency | undefined) =>
        next ?? prev,
      default: () => undefined,
    },
    quote: {
      value: (
        prev:
          | {
              price: number
              frequency: Frequency
              service_inclusions: string[]
            }
          | undefined,
        next:
          | {
              price: number
              frequency: Frequency
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
      value: (prev: ConversationStage, next: ConversationStage) => next ?? prev,
      default: () => 'greeting' as ConversationStage,
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

// Add nodes - chain them so TypeScript tracks the accumulated node type union
workflow
  .addNode('greeting', greetingNode)
  .addNode('address_extraction', addressExtractionNode)
  .addNode('frequency_collection', frequencyCollectionNode)
  .addNode('property_lookup', propertyLookupNode)
  .addNode('quote_calculation', quoteCalculationNode)
  .addNode('booking_appointment', bookingNode)
  .addNode('closing', closingNode)

// Conditional routing function - enforces routing to valid nodes only
function routeBasedOnStage(state: ConversationState): GraphNode | typeof END {
  switch (state.stage) {
    case 'greeting':
      return 'address_extraction'
    case 'address_collection':
      return 'address_extraction'
    case 'WAITING_FOR_ADDRESS':
      return END // PAUSE: Stop and wait for user to provide address
    case 'frequency_collection':
      return 'frequency_collection'
    case 'WAITING_FOR_FREQUENCY':
      return END // PAUSE: Stop and wait for user to provide frequency
    case 'property_lookup':
      return 'property_lookup'
    case 'quoting':
      return 'quote_calculation'
    case 'WAITING_FOR_BOOKING_DECISION':
      return END // PAUSE: Stop and wait for user to decide about booking
    case 'booking':
      return 'booking_appointment'
    case 'closing':
      return 'closing'
    case 'END':
      return END
    default:
      return END
  }
}

// Set entry point
workflow.setEntryPoint('greeting')

// Add conditional edges from each node
workflow.addConditionalEdges('greeting', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('address_extraction', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('frequency_collection', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('property_lookup', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('quote_calculation', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('booking_appointment', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

workflow.addConditionalEdges('closing', routeBasedOnStage, {
  address_extraction: 'address_extraction',
  frequency_collection: 'frequency_collection',
  property_lookup: 'property_lookup',
  quote_calculation: 'quote_calculation',
  booking_appointment: 'booking_appointment',
  closing: 'closing',
  [END]: END,
})

// Compile the graph
export const conversationGraph = workflow.compile()
