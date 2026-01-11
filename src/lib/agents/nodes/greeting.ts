import { ConversationState } from '../state'
import { prisma } from '@/lib/prisma'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

export async function greetingNode(state: ConversationState): Promise<Partial<ConversationState>> {
  console.log('[GREETING NODE] Entry - state:', {
    stage: state.stage,
    messageCount: state.messages.length,
    hasAssistantMessage: state.messages.some((m) => m.role === 'assistant')
  })

  // Check if we've already greeted - if messages contain an assistant message, skip greeting
  const hasGreeted = state.messages.some((m) => m.role === 'assistant')
  if (hasGreeted) {
    console.log('[GREETING NODE] Already greeted, checking stage for routing...')

    // Already greeted - check what stage we should resume from
    if (state.stage === 'intent_routing') {
      console.log('[GREETING NODE] Staying at intent_routing stage')
      console.log('[GREETING NODE] Current state.messages:', state.messages)
      console.log('[GREETING NODE] state.messages type:', typeof state.messages)
      console.log('[GREETING NODE] state.messages is array:', Array.isArray(state.messages))
      const result = { stage: 'intent_routing' as const }
      console.log('[GREETING NODE] Returning result:', JSON.stringify(result))
      console.log('[GREETING NODE] Result has messages property:', 'messages' in result)
      return result
    }
    if (state.stage === 'WAITING_FOR_ADDRESS') {
      console.log('[GREETING NODE] Routing to address_collection')
      return { stage: 'address_collection' } // Resume address extraction
    }
    if (state.stage === 'WAITING_FOR_FREQUENCY') {
      console.log('[GREETING NODE] Routing to frequency_collection')
      return { stage: 'frequency_collection' } // Resume frequency collection
    }
    if (state.stage === 'WAITING_FOR_BOOKING_DECISION') {
      console.log('[GREETING NODE] Routing to booking')
      return { stage: 'booking' } // Resume booking flow
    }
    // Default: continue address collection
    console.log('[GREETING NODE] Default routing to address_collection')
    return { stage: 'address_collection' }
  }

  const tenant = await prisma.tenants.findUnique({
    where: { id: state.tenant_id },
    select: { business_name: true },
  })

  // Try to extract customer name from the initial greeting message
  let customerName: string | undefined

  const userMessage = state.messages.filter((m) => m.role === 'user').pop()
  if (userMessage) {
    try {
      // ✅ OPTION A: Use message array format
      const systemPrompt = state.system_context ||
        'You are a helpful AI assistant for a lawn care business. Be friendly, professional, and concise.'

      const taskInstructions = `TASK: Extract the customer's name from greeting messages.

Return ONLY valid JSON:
{
  "name": "John Doe" or null
}

Examples:
- "Hi, I'm Sarah" -> {"name": "Sarah"}
- "This is Michael Davis" -> {"name": "Michael Davis"}
- "My name is Jennifer" -> {"name": "Jennifer"}
- "I need a quote" -> {"name": null}`

      const response = await llm.invoke([
        new SystemMessage(`${systemPrompt}\n\n${taskInstructions}`),
        new HumanMessage(userMessage.content)
      ])
      let jsonString = (response.content as string).trim()
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
      }

      const extracted = JSON.parse(jsonString)
      if (extracted.name) {
        customerName = extracted.name
      }
    } catch (error) {
      // Name extraction failed - that's okay, continue without it
      console.log('Name extraction in greeting failed:', error)
    }
  }

  // More conversational greeting - don't immediately ask for address
  const greetingMessage = customerName
    ? `Hi ${customerName}! Thanks for calling ${tenant?.business_name}. How can I help you today?`
    : `Thanks for calling ${tenant?.business_name}! How can I help you today?`

  console.log('[GREETING NODE] Creating new greeting message:', greetingMessage)

  const result = {
    customer_name: customerName || state.customer_name,
    messages: [
      {
        role: 'assistant' as const,
        content: greetingMessage,
      },
    ],
    stage: 'intent_routing' as const, // Route to intent classification instead of forcing address
  }

  console.log('[GREETING NODE] Returning new greeting:', {
    customer_name: result.customer_name,
    messageCount: result.messages.length,
    stage: result.stage
  })

  return result
}
