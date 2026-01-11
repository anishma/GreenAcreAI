import { StateGraph, END, START, Annotation } from '@langchain/langgraph'
import { ConversationState, Frequency, ConversationStage } from './state'
import { greetingNode } from './nodes/greeting'
import { intentRouterNode } from './nodes/intent-router'
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
  | 'intent_router' // NEW: Classifies user intent before forcing booking flow
  | 'address_extraction'
  | 'frequency_collection'
  | 'property_lookup'
  | 'quote_calculation'
  | 'booking_appointment'
  | 'closing'

// Define state annotation using new LangGraph v1.0 API
const StateAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  system_context: Annotation<string | undefined>({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  tenant_id: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => '',
  }),
  call_id: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
    default: () => '',
  }),
  customer_phone: Annotation<string | undefined>({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  customer_name: Annotation<string | undefined>({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  customer_address: Annotation<
    | { street: string; city: string; state: string; zip: string }
    | undefined
  >({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  property_data: Annotation<
    | { lot_size_sqft: number; parcel_id: string }
    | undefined
  >({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  preferred_frequency: Annotation<Frequency | undefined>({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  quote: Annotation<
    | {
        price: number
        frequency: Frequency
        service_inclusions: string[]
      }
    | undefined
  >({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  chosen_time: Annotation<string | undefined>({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  booking: Annotation<
    | { scheduled_at: string; calendar_event_id: string }
    | undefined
  >({
    reducer: (prev, next) => next ?? prev,
    default: () => undefined,
  }),
  stage: Annotation<ConversationStage>({
    reducer: (prev, next) => next ?? prev,
    default: () => 'greeting' as ConversationStage,
  }),
  attempts: Annotation<{ address_extraction: number; property_lookup: number }>({
    reducer: (prev, next) => next ?? prev,
    default: () => ({ address_extraction: 0, property_lookup: 0 }),
  }),
})

// Define the graph with explicit node types to enable setEntryPoint and routing
// Chain all addNode calls first, then add edges - this ensures TypeScript tracks all node names
const workflow = new StateGraph(StateAnnotation)
  .addNode('greeting', greetingNode)
  .addNode('intent_router', intentRouterNode) // Intent classification - optimized as entry point
  .addNode('address_extraction', addressExtractionNode)
  .addNode('frequency_collection', frequencyCollectionNode)
  .addNode('property_lookup', propertyLookupNode)
  .addNode('quote_calculation', quoteCalculationNode)
  .addNode('booking_appointment', bookingNode)
  .addNode('closing', closingNode)
  // Set entry point to intent_router to skip greeting (VAPI already greeted)
  // This saves ~100ms by avoiding unnecessary greeting node passthrough
  .addEdge(START, 'intent_router')
  // Add conditional edges from each node
  .addConditionalEdges('greeting', routeBasedOnStage)
  .addConditionalEdges('intent_router', routeBasedOnStage)
  .addConditionalEdges('address_extraction', routeBasedOnStage)
  .addConditionalEdges('frequency_collection', routeBasedOnStage)
  .addConditionalEdges('property_lookup', routeBasedOnStage)
  .addConditionalEdges('quote_calculation', routeBasedOnStage)
  .addConditionalEdges('booking_appointment', routeBasedOnStage)
  .addConditionalEdges('closing', routeBasedOnStage)

// Conditional routing function - enforces routing to valid nodes only
function routeBasedOnStage(state: ConversationState): GraphNode | typeof END {
  switch (state.stage) {
    case 'greeting':
      return 'intent_router' // Route to intent classification first
    case 'intent_routing':
      return 'intent_router' // Run intent classification
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
    case 'WAITING_FOR_TIME_SLOT':
      return END // PAUSE: Stop and wait for user to choose time slot
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

// Compile the graph
export const conversationGraph = workflow.compile()
