import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { prisma } from '@/lib/prisma'

// Optimized LLM for intent classification - faster response
const intentLLM = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
  maxTokens: 30, // Limit tokens for faster intent classification (only need ~20)
})

// Optimized LLM for FAQ responses - balanced speed and quality
const faqLLM = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 80, // Limit response length for faster generation
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
  console.log('[INTENT ROUTER NODE] ===== ENTRY =====')
  console.log('[INTENT ROUTER NODE] Entry - state:', {
    stage: state.stage,
    messageCount: state.messages.length,
    messagesArray: Array.isArray(state.messages),
    tenant_id: state.tenant_id,
    call_id: state.call_id
  })
  console.log('[INTENT ROUTER NODE] All messages:', JSON.stringify(state.messages, null, 2))

  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  console.log('[INTENT ROUTER NODE] Last user message:', lastUserMessage?.content || 'none')

  if (!lastUserMessage) {
    // No user message - shouldn't happen, but safe fallback
    console.log('[INTENT ROUTER NODE] No user message found, returning address_collection stage')
    return { stage: 'address_collection' }
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

  // Optimized: Minimal prompt for faster classification (~50 tokens vs ~250 tokens)
  const taskInstructions = `Classify intent as JSON only:
{"intent": "general_question" | "introduction" | "booking_intent" | "unclear"}

general_question: asking about services/pricing/hours/areas
introduction: giving name/greeting
booking_intent: wants quote/booking/address/frequency
unclear: vague/yes/no`

  try {
    console.log('[INTENT ROUTER NODE] Invoking LLM for intent classification...')

    // Optimized: Use intent-specific LLM with simplified prompt (no system context needed)
    const response = await intentLLM.invoke([
      new SystemMessage(taskInstructions),
      new HumanMessage(lastUserMessage.content)
    ])
    let jsonString = (response.content as string).trim()

    console.log('[INTENT ROUTER NODE] LLM response:', jsonString)

    // Clean markdown
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const { intent } = JSON.parse(jsonString)
    console.log('[INTENT ROUTER NODE] Parsed intent:', intent)

    // Handle each intent type
    switch (intent) {
      case 'general_question':
        console.log('[INTENT ROUTER NODE] Handling general_question...')
        return await handleGeneralQuestion(state, lastUserMessage.content, tenant)

      case 'introduction':
        console.log('[INTENT ROUTER NODE] Handling introduction...')
        return await handleIntroduction(state, lastUserMessage.content)

      case 'booking_intent':
        console.log('[INTENT ROUTER NODE] Handling booking_intent, routing to address_collection')
        // Proceed to address extraction
        const bookingResult = { stage: 'address_collection' as const }
        console.log('[INTENT ROUTER NODE] Returning booking result:', JSON.stringify(bookingResult))
        console.log('[INTENT ROUTER NODE] Result has messages property:', 'messages' in bookingResult)
        return bookingResult

      case 'unclear':
        console.log('[INTENT ROUTER NODE] Handling unclear intent')
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
        console.log('[INTENT ROUTER NODE] Unknown intent, defaulting to address_collection')
        // Fallback
        return { stage: 'address_collection' }
    }
  } catch (error) {
    console.error('[INTENT ROUTER NODE] Intent classification error:', error)
    // Fallback to address collection on error
    return { stage: 'address_collection' }
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
  console.log('[INTENT ROUTER - handleGeneralQuestion] ===== ENTRY =====')

  // Optimization: Template-based responses for common questions (saves ~1500ms)
  const lowerQuestion = question.toLowerCase()
  const businessName = tenant?.business_name || 'We'
  const frequencies = tenant?.supports_one_time_service
    ? 'weekly, biweekly, monthly, or one-time'
    : 'weekly, biweekly, or monthly'

  // Pattern match common questions with template responses
  if (lowerQuestion.includes('what services') || lowerQuestion.includes('what do you')) {
    return {
      messages: [{
        role: 'assistant' as const,
        content: `${businessName} provide${businessName === 'We' ? '' : 's'} lawn mowing, edging, and blowing services. We offer ${frequencies} service. Would you like a quote for your lawn?`
      }],
      stage: 'WAITING_FOR_ADDRESS' as const
    }
  }

  if (lowerQuestion.includes('how much') || lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('pricing')) {
    return {
      messages: [{
        role: 'assistant' as const,
        content: `Our pricing depends on your lot size. I can give you an exact quote if you provide your address. What's your property address?`
      }],
      stage: 'WAITING_FOR_ADDRESS' as const
    }
  }

  if (lowerQuestion.includes('what areas') || lowerQuestion.includes('where do you') || lowerQuestion.includes('service area')) {
    const areas = tenant?.service_areas?.slice(0, 3).join(', ') || 'your local area'
    return {
      messages: [{
        role: 'assistant' as const,
        content: `We service ${areas}${tenant?.service_areas?.length > 3 ? ' and more' : ''}. What's your address so I can confirm we serve your area?`
      }],
      stage: 'WAITING_FOR_ADDRESS' as const
    }
  }

  // Fall back to LLM for complex questions (saves ~800ms with optimizations)
  // Optimized: Concise business context (~100 tokens vs ~300 tokens)
  const businessContext = `${businessName} offer${businessName === 'We' ? '' : 's'} lawn mowing/edging/blowing (${frequencies}).
Areas: ${tenant?.service_areas?.slice(0, 3).join(', ') || 'local area'}.
Answer in 1-2 sentences, then ask: "Would you like a quote?"`

  try {
    // Optimized: Use FAQ-specific LLM with simplified prompt
    const response = await faqLLM.invoke([
      new SystemMessage(businessContext),
      new HumanMessage(question)
    ])
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

    const result = {
      messages: [
        {
          role: 'assistant' as const,
          content: answer,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS' as const, // Wait for them to respond
    }
    console.log('[INTENT ROUTER - handleGeneralQuestion] Returning result:', JSON.stringify(result))
    console.log('[INTENT ROUTER - handleGeneralQuestion] Result.messages is array:', Array.isArray(result.messages))
    console.log('[INTENT ROUTER - handleGeneralQuestion] Result.messages length:', result.messages.length)
    return result
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
  console.log('[INTENT ROUTER - handleIntroduction] ===== ENTRY =====')

  // Optimized: Minimal name extraction prompt
  const taskInstructions = `Extract name as JSON:
{"name": "First Last" or null}

Examples: "I'm Sarah" -> {"name": "Sarah"}, "Hi" -> {"name": null}`

  try {
    // Optimized: Use intent LLM for quick name extraction
    const response = await intentLLM.invoke([
      new SystemMessage(taskInstructions),
      new HumanMessage(message)
    ])
    let jsonString = (response.content as string).trim()

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const extracted = JSON.parse(jsonString)
    const customerName = extracted.name || state.customer_name

    const result = {
      customer_name: customerName,
      messages: [
        {
          role: 'assistant' as const,
          content: customerName
            ? `Nice to meet you, ${customerName}! Are you looking for a lawn mowing quote?`
            : `How can I help you today?`,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS' as const, // Wait for their response
    }
    console.log('[INTENT ROUTER - handleIntroduction] Returning result:', JSON.stringify(result))
    console.log('[INTENT ROUTER - handleIntroduction] Result.messages is array:', Array.isArray(result.messages))
    console.log('[INTENT ROUTER - handleIntroduction] Result.messages length:', result.messages.length)
    return result
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

// Removed formatPricingInfo and formatBusinessHours - no longer needed with optimized prompts
