import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
  modelKwargs: {
    response_format: { type: 'json_object' },
  },
})

export async function addressExtractionNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    return {
      messages: [{
          role: 'assistant',
          content: 'I need your address to provide a quote. What is your street address, city, state, and ZIP code?',
        },
      ],
      attempts: {
        ...state.attempts,
        address_extraction: state.attempts.address_extraction + 1,
      },
    }
  }

  // ✅ OPTION A: Use message array format
  const systemPrompt = state.system_context ||
    'You are a helpful AI assistant for a lawn care business. Be friendly, professional, and concise.'

  const taskInstructions = `TASK: Extract address components and customer name from user messages.

You must respond with ONLY a valid JSON object. Do not include any conversational text, greetings, or explanations.

Extract these fields from the user's message:
- name: Customer's name (string or null)
- street: Street address (string or null)
- city: City name (string or null)
- state: 2-letter state code (string or null)
- zip: 5-digit ZIP code (string or null)

If any component is missing or unclear, use null for that field.

Common patterns:
- "Hi, I'm Sarah and I live at 123 Oak Street..." -> Extract "Sarah" as name
- "This is John, my address is..." -> Extract "John" as name
- "My name is Maria..." -> Extract "Maria" as name
- "I'm at 123 Main St" -> name is null (no name mentioned)

Required JSON output format:
{
  "name": "John Doe",
  "street": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701"
}

Remember: Return ONLY valid JSON, no other text.`

  try {
    const response = await llm.invoke([
      new SystemMessage(`${systemPrompt}\n\n${taskInstructions}`),
      new HumanMessage(lastUserMessage.content)
    ])

    // Clean up response - remove markdown code blocks if present
    let jsonString = (response.content as string).trim()
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    const extracted = JSON.parse(jsonString)

    // Validate all required address fields are present
    if (extracted.street && extracted.city && extracted.state && extracted.zip) {
      return {
        // Use extracted name if provided, otherwise keep existing name from state
        customer_name: extracted.name || state.customer_name || undefined,
        customer_address: {
          street: extracted.street,
          city: extracted.city,
          state: extracted.state,
          zip: extracted.zip,
        },
        stage: 'frequency_collection', // Route to frequency collection first
        attempts: {
          ...state.attempts,
          address_extraction: 0, // Reset counter on success
        },
        // ✅ FIXED: Removed messages: []
      }
    }

    // Max 3 attempts - give up and close
    if (state.attempts.address_extraction >= 2) {
      return {
        messages: [{
            role: 'assistant',
            content: "I'm having trouble understanding your address. Could you please provide your full street address, city, state, and ZIP code? For example: 123 Main Street, Springfield, IL 62701",
          },
        ],
        stage: 'closing',
      }
    }

    // Ask for clarification and WAIT for user response (don't loop)
    const missingFields = []
    if (!extracted.street) missingFields.push('street address')
    if (!extracted.city) missingFields.push('city')
    if (!extracted.state) missingFields.push('state')
    if (!extracted.zip) missingFields.push('ZIP code')

    return {
      messages: [{
          role: 'assistant',
          content: `I need a bit more information. Could you provide your ${missingFields.join(', ')}?`,
        },
      ],
      stage: 'WAITING_FOR_ADDRESS', // NEW: Pause here, don't loop
      attempts: {
        ...state.attempts,
        address_extraction: state.attempts.address_extraction + 1,
      },
    }
  } catch (error) {
    console.error('Address extraction error:', error)
    return {
      messages: [{
          role: 'assistant',
          content: 'Could you please repeat your address? I need your street, city, state, and ZIP code.',
        },
      ],
      attempts: {
        ...state.attempts,
        address_extraction: state.attempts.address_extraction + 1,
      },
    }
  }
}
