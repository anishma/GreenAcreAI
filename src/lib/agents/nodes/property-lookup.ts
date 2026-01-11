import { mcpClient } from '@/lib/mcp/client'
import { ConversationState } from '../state'

export async function propertyLookupNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  if (!state.customer_address) {
    throw new Error('Address required for property lookup')
  }

  try {
    // Call MCP property lookup server via MCP client
    const propertyData = await mcpClient.callTool<{
      lot_size_sqft: number
      parcel_id: string
      address: string
      zoning: string
    }>(
      'property-lookup',
      'lookup_property',
      {
        street: state.customer_address.street,
        city: state.customer_address.city,
        state: state.customer_address.state,
        zip: state.customer_address.zip,
      }
    )

    return {
      property_data: {
        lot_size_sqft: propertyData.lot_size_sqft,
        parcel_id: propertyData.parcel_id,
      },
      stage: 'quoting',
      messages: [{
          role: 'assistant',
          content: `Great! I found your property. It's about ${propertyData.lot_size_sqft.toLocaleString()} square feet.`,
        },
      ],
    }
  } catch (error) {
    console.error('Property lookup error:', error)
    // Property not found - fallback to generic quote
    return {
      stage: 'quoting',
      messages: [{
          role: 'assistant',
          content: `I couldn't find the exact property details, but I can give you a general price range for your area.`,
        },
      ],
    }
  }
}
