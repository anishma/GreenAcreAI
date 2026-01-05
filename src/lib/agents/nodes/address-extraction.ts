import { ConversationState } from '../state'
import { ChatOpenAI } from '@langchain/openai'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

export async function addressExtractionNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    return {
      messages: [
        ...state.messages,
        {
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

  // Use GPT-4 to extract address components
  const extractionPrompt = `Extract the address components from the following message. Return a JSON object with street, city, state (2-letter code), and zip (5 digits).

If any component is missing or unclear, return null for that field.

User message: "${lastUserMessage.content}"

Return ONLY valid JSON with this exact structure:
{
  "street": "123 Main St" or null,
  "city": "Springfield" or null,
  "state": "IL" or null,
  "zip": "62701" or null
}`

  try {
    const response = await llm.invoke(extractionPrompt)
    const extracted = JSON.parse(response.content as string)

    // Validate all fields are present
    if (extracted.street && extracted.city && extracted.state && extracted.zip) {
      return {
        customer_address: {
          street: extracted.street,
          city: extracted.city,
          state: extracted.state,
          zip: extracted.zip,
        },
        stage: 'property_lookup',
        attempts: {
          ...state.attempts,
          address_extraction: 0, // Reset counter on success
        },
      }
    }

    // Max 3 attempts
    if (state.attempts.address_extraction >= 2) {
      return {
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: "I'm having trouble understanding your address. Could you please provide your full street address, city, state, and ZIP code? For example: 123 Main Street, Springfield, IL 62701",
          },
        ],
        stage: 'closing',
      }
    }

    // Ask for clarification
    const missingFields = []
    if (!extracted.street) missingFields.push('street address')
    if (!extracted.city) missingFields.push('city')
    if (!extracted.state) missingFields.push('state')
    if (!extracted.zip) missingFields.push('ZIP code')

    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: `I need a bit more information. Could you provide your ${missingFields.join(', ')}?`,
        },
      ],
      attempts: {
        ...state.attempts,
        address_extraction: state.attempts.address_extraction + 1,
      },
    }
  } catch (error) {
    console.error('Address extraction error:', error)
    return {
      messages: [
        ...state.messages,
        {
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
