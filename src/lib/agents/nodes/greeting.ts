import { ConversationState } from '../state'
import { prisma } from '@/lib/prisma'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

export async function greetingNode(state: ConversationState): Promise<Partial<ConversationState>> {
  // Check if we've already greeted - if messages contain an assistant message, skip greeting
  const hasGreeted = state.messages.some((m) => m.role === 'assistant')
  if (hasGreeted) {
    // Already greeted - check what stage we should resume from
    // ✅ FIXED: Removed messages: [] to prevent EmptyChannelError
    if (state.stage === 'WAITING_FOR_ADDRESS') {
      return { stage: 'address_collection' } // Resume address extraction
    }
    if (state.stage === 'WAITING_FOR_FREQUENCY') {
      return { stage: 'frequency_collection' } // Resume frequency collection
    }
    if (state.stage === 'WAITING_FOR_BOOKING_DECISION') {
      return { stage: 'booking' } // Resume booking flow
    }
    // Default: continue address collection
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

  return {
    customer_name: customerName || state.customer_name,
    messages: [
      {
        role: 'assistant',
        content: greetingMessage,
      },
    ],
    stage: 'intent_routing', // Route to intent classification instead of forcing address
  }
}
