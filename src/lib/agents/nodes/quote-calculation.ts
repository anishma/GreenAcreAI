import { mcpClient } from '@/lib/mcp/client'
import { ConversationState } from '../state'

export async function quoteCalculationNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const address = state.customer_address!

  try {
    // First, validate service area
    const serviceAreaCheck = await mcpClient.callTool<{
      in_service_area: boolean
      service_radius_miles: number
      distance_miles: number
    }>(
      'business-logic',
      'validate_service_area',
      {
        tenant_id: state.tenant_id,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      }
    )

    if (!serviceAreaCheck.in_service_area) {
      return {
        stage: 'closing',
        messages: [{
            role: 'assistant',
            content: `I appreciate your interest! Unfortunately, we currently only service properties within ${serviceAreaCheck.service_radius_miles} miles of our location, and your property is about ${serviceAreaCheck.distance_miles.toFixed(1)} miles away. We may be expanding our service area soon - would you like me to note your address for future reference?`,
          },
        ],
      }
    }

    // Property is in service area - calculate quote
    if (state.property_data?.lot_size_sqft) {
      // We have specific lot size - attempt to get quote
      const frequency = state.preferred_frequency || 'weekly'

      try {
        const quote = await mcpClient.callTool<{
          price_per_visit: number
          frequency: 'weekly' | 'biweekly'
          service_inclusions: string[]
          tier_name: string
        }>(
          'business-logic',
          'calculate_quote',
          {
            tenant_id: state.tenant_id,
            lot_size_sqft: state.property_data.lot_size_sqft,
            frequency: frequency === 'one-time' ? 'weekly' : frequency, // Use weekly pricing for one-time
          }
        )

        const frequencyDisplay = frequency === 'one-time' ? 'one-time' : frequency

        return {
          quote: {
            price: quote.price_per_visit,
            frequency: quote.frequency,
            service_inclusions: quote.service_inclusions,
          },
          stage: 'WAITING_FOR_BOOKING_DECISION', // NEW: Wait for user to decide
          messages: [{
              role: 'assistant',
              content: `Based on your property size, I can offer you ${frequencyDisplay} lawn mowing service for $${quote.price_per_visit} per visit. This includes: ${quote.service_inclusions.join(', ')}. Would you like to schedule your first appointment?`,
            },
          ],
        }
      } catch (error) {
        // No pricing tier found - lot size exceeds maximum tier (needs custom quote)
        console.log(`Large lot detected: ${state.property_data.lot_size_sqft} sqft - needs custom quote`)

        const acresEstimate = (state.property_data.lot_size_sqft / 43560).toFixed(2)

        return {
          stage: 'closing',
          messages: [{
              role: 'assistant',
              content: `Your property is approximately ${acresEstimate} acres, which is larger than our standard pricing tiers. I'd like to have the owner call you directly to provide a custom quote for your property. This ensures you get accurate pricing for the size of your lawn. What's the best phone number to reach you?`,
            },
          ],
        }
      }
    } else {
      // No specific lot size - provide generic price range
      const frequency = state.preferred_frequency || 'weekly'
      const priceRange = await mcpClient.callTool<{
        min_price: number
        max_price: number
        typical_frequency: 'weekly' | 'biweekly'
      }>(
        'business-logic',
        'get_generic_price_range',
        {
          tenant_id: state.tenant_id,
        }
      )

      const frequencyDisplay = frequency === 'one-time' ? 'one-time' : frequency

      return {
        stage: 'WAITING_FOR_BOOKING_DECISION', // NEW: Wait for user to decide
        messages: [{
            role: 'assistant',
            content: `For properties in your area, our ${frequencyDisplay} lawn mowing service typically ranges from $${priceRange.min_price} to $${priceRange.max_price} per visit, depending on lot size. This includes mowing, edging, and blowing. Would you like to schedule an appointment so we can give you an exact quote after seeing your property?`,
          },
        ],
      }
    }
  } catch (error) {
    console.error('Quote calculation error:', error)
    return {
      stage: 'closing',
      messages: [{
          role: 'assistant',
          content: "I'm having trouble calculating a quote right now. Could you please call us back or visit our website to get pricing information?",
        },
      ],
    }
  }
}
