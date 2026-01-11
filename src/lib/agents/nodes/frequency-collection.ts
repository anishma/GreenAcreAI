import { ConversationState } from '../state'
import { prisma } from '@/lib/prisma'
import { ChatOpenAI } from '@langchain/openai'

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
})

export async function frequencyCollectionNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  // Check if we already have frequency
  if (state.preferred_frequency) {
    return { stage: 'property_lookup' }
  }

  // Get tenant settings to see which frequencies they support
  const tenant = await prisma.tenants.findUnique({
    where: { id: state.tenant_id },
    select: {
      pricing_tiers: true,
      supports_one_time_service: true,
    },
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  // Parse pricing tiers to determine supported frequencies
  const pricingTiers = tenant.pricing_tiers as any[]
  const supportedFrequencies: string[] = []

  if (pricingTiers && pricingTiers.length > 0) {
    const firstTier = pricingTiers[0]
    if (firstTier.weekly_price != null) supportedFrequencies.push('weekly')
    if (firstTier.biweekly_price != null) supportedFrequencies.push('biweekly')
    if (firstTier.monthly_price != null) supportedFrequencies.push('monthly')
  }

  if (tenant.supports_one_time_service) {
    supportedFrequencies.push('one-time')
  }

  if (supportedFrequencies.length === 0) {
    // No frequencies configured - error
    return {
      stage: 'closing',
      messages: [{
          role: 'assistant',
          content: "I'm sorry, but we're not able to provide service quotes at this time. Please contact us directly.",
        },
      ],
    }
  }

  // Check if user already provided frequency preference in last message
  const lastUserMessage = state.messages
    .filter((m) => m.role === 'user')
    .pop()

  if (lastUserMessage) {
    // Use GPT to extract frequency from user message
    const frequencyOptions = supportedFrequencies.map((f) => {
      if (f === 'biweekly') return 'biweekly (every 2 weeks)'
      if (f === 'one-time') return 'one-time (single service)'
      return f
    })

    const extractionPrompt = `Extract the service frequency preference from the following message. The supported frequencies are: ${frequencyOptions.join(', ')}.

User message: "${lastUserMessage.content}"

Return ONLY one of these exact values (without explanation):
- "weekly" if they want weekly service
- "biweekly" if they want biweekly/bi-weekly/every 2 weeks service
- "monthly" if they want monthly service
- "one-time" if they want one-time/single/once service
- "none" if no frequency is mentioned

Return only the frequency value, nothing else.`

    try {
      const response = await llm.invoke(extractionPrompt)
      const extractedFrequency = (response.content as string).trim().toLowerCase()

      if (
        extractedFrequency !== 'none' &&
        supportedFrequencies.includes(extractedFrequency)
      ) {
        // Valid frequency extracted
        return {
          preferred_frequency: extractedFrequency as
            | 'weekly'
            | 'biweekly'
            | 'monthly'
            | 'one-time',
          stage: 'property_lookup',
        }
      }
    } catch (error) {
      console.error('Frequency extraction error:', error)
    }
  }

  // No valid frequency yet - ask the user
  const frequencyOptionsText = supportedFrequencies
    .map((f) => {
      if (f === 'biweekly') return 'biweekly (every 2 weeks)'
      if (f === 'one-time') return 'one-time service'
      return f
    })
    .join(', ')

  return {
    messages: [{
        role: 'assistant',
        content: `Great! We offer ${frequencyOptionsText}. Which would you prefer?`,
      },
    ],
    stage: 'WAITING_FOR_FREQUENCY',
  }
}
