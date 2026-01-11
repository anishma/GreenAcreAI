import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@/lib/prisma'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

/**
 * Intent Router Node
 *
 * Classifies user intent before forcing them into the booking funnel.
 * Handles:
 * - General questions (FAQs about services, pricing, hours)
 * - Social pleasantries (greetings, introductions)
 * - Booking intent (wants a quote, has address)
 */
export async function intentRouterNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    // No user message - shouldn't happen, but safe fallback
    return { stage: 'address_collection', messages: [] }
  }

  // Get tenant info for FAQ responses
  const tenant = await prisma.tenants.findUnique({
    where: { id: state.tenant_id },
    select: {
      business_name: true,
      service_areas: true,
      pricing_tiers: true,
      supports_one_time_service: true,
      business_hours: true,
    },
  })

  // Classify intent using LLM
  const intentPrompt = `You are classifying customer intent in a lawn care phone conversation.

User message: "${lastUserMessage.content}"

Conversation context:
- Customer name: ${state.customer_name || 'unknown'}
- Has address: ${state.customer_address ? 'yes' : 'no'}
- Has frequency: ${state.preferred_frequency || 'no'}

Classify the intent into ONE of these categories:

1. "general_question" - User is asking about services, pricing, hours, service areas, what you do, etc.
   Examples: "What services do you offer?", "How much does it cost?", "What areas do you serve?"

2. "introduction" - User is introducing themselves, giving their name, or making small talk
   Examples: "My name is John", "I'm Sarah", "Hi, this is Mike"

3. "booking_intent" - User wants a quote, is ready to book, or is providing booking information (address, frequency)
   Examples: "I need a quote", "I want to book", "123 Main St", "weekly service"

4. "unclear" - User message is vague or you can't determine intent
   Examples: "Hello", "Yes", "Okay"

Return ONLY valid JSON:
{
  "intent": "general_question" | "introduction" | "booking_intent" | "unclear",
  "confidence": 0.0 to 1.0
}`

  try {
    const response = await llm.invoke(intentPrompt)
    let jsonString = (response.content as string).trim()

    // Clean markdown
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const { intent, confidence: _confidence } = JSON.parse(jsonString)

    // Handle each intent type
    switch (intent) {
      case 'general_question':
        return await handleGeneralQuestion(state, lastUserMessage.content, tenant)

      case 'introduction':
        return await handleIntroduction(state, lastUserMessage.content)

      case 'booking_intent':
        // Proceed to address extraction
        return { stage: 'address_collection', messages: [] }

      case 'unclear':
        // Be helpful and ask an open-ended question
        return {
          messages: [
            {
              role: 'assistant',
              content: state.customer_name
                ? `How can I help you today, ${state.customer_name}?`
                : 'How can I help you today?',
            },
          ],
          stage: 'WAITING_FOR_ADDRESS', // Wait for clarification
        }

      default:
        // Fallback
        return { stage: 'address_collection', messages: [] }
    }
  } catch (error) {
    console.error('Intent classification error:', error)
    // Fallback to address collection on error
    return { stage: 'address_collection', messages: [] }
  }
}

/**
 * Handle general questions about services, pricing, etc.
 */
async function handleGeneralQuestion(
  state: ConversationState,
  question: string,
  tenant: any
): Promise<Partial<ConversationState>> {
  // Generate FAQ response using LLM with tenant context
  const faqPrompt = `You are a friendly lawn care assistant for ${tenant?.business_name || 'our company'}.

Answer this customer question briefly and naturally (1-2 sentences):
"${question}"

Business information:
- Services: Lawn mowing, edging, blowing (available ${tenant?.supports_one_time_service ? 'weekly, biweekly, monthly, or one-time' : 'weekly, biweekly, or monthly'})
- Service areas: ${tenant?.service_areas?.join(', ') || 'your local area'}
- Pricing: ${formatPricingInfo(tenant?.pricing_tiers)}
- Hours: ${formatBusinessHours(tenant?.business_hours)}

After answering, ask: "Would you like a quote for your lawn?"

Be conversational and helpful. Don't list everything - just answer their specific question.`

  try {
    const response = await llm.invoke(faqPrompt)
    let answer = (response.content as string).trim()

    // Personalize with customer name if available
    if (state.customer_name) {
      // Add name to the call-to-action if it doesn't already include it
      if (!answer.includes(state.customer_name)) {
        answer = answer.replace(
          /Would you like a quote for your lawn\?/i,
          `Would you like a quote for your lawn, ${state.customer_name}?`
        )
      }
    }

    return {
      messages: [
        {
          role: 'assistant',
          content: answer,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS', // Wait for them to respond
    }
  } catch (error) {
    console.error('FAQ generation error:', error)
    // Fallback response with personalization
    const fallbackMessage = state.customer_name
      ? `We offer lawn mowing, edging, and blowing services. Would you like a quote for your property, ${state.customer_name}?`
      : `We offer lawn mowing, edging, and blowing services. Would you like a quote for your property?`

    return {
      messages: [
        {
          role: 'assistant',
          content: fallbackMessage,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS',
    }
  }
}

/**
 * Handle introductions and name exchanges
 */
async function handleIntroduction(
  state: ConversationState,
  message: string
): Promise<Partial<ConversationState>> {
  // Extract name if provided
  const nameExtractionPrompt = `Extract the customer's name from this message.

User message: "${message}"

Return ONLY valid JSON:
{
  "name": "John Doe" or null
}

Examples:
- "My name is Sarah" -> {"name": "Sarah"}
- "This is Michael Davis calling" -> {"name": "Michael Davis"}
- "I'm Jennifer" -> {"name": "Jennifer"}
- "Hi there" -> {"name": null}`

  try {
    const response = await llm.invoke(nameExtractionPrompt)
    let jsonString = (response.content as string).trim()

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const extracted = JSON.parse(jsonString)
    const customerName = extracted.name || state.customer_name

    return {
      customer_name: customerName,
      messages: [
        {
          role: 'assistant',
          content: customerName
            ? `Nice to meet you, ${customerName}! Are you looking for a lawn care quote?`
            : `How can I help you today?`,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS', // Wait for their response
    }
  } catch (error) {
    console.error('Name extraction error:', error)
    return {
      messages: [
        {
          role: 'assistant',
          content: 'How can I help you today?',
        },
      ],
      stage: 'WAITING_FOR_ADDRESS',
    }
  }
}

/**
 * Format pricing info for FAQ responses
 */
function formatPricingInfo(pricingTiers: any): string {
  if (!pricingTiers) {
    return 'Pricing varies by lot size'
  }

  const tiers = Object.entries(pricingTiers).map(([size, data]: [string, any]) => {
    return `$${data.price} for ${size} lots (${data.min}-${data.max} sqft)`
  })

  return tiers.join(', ')
}

/**
 * Format business hours for FAQ responses
 */
function formatBusinessHours(hours: any): string {
  if (!hours || typeof hours !== 'object') {
    return 'Monday-Friday 8am-6pm'
  }

  // Simple formatting - can be enhanced
  return 'Monday-Friday 8am-6pm'
}
