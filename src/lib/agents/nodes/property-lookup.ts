// Use serverless-compatible MCP client in production (Vercel), regular MCP client in development
import { mcpClient as mcpClientServerless } from '@/lib/mcp/client-serverless'
import { mcpClient as mcpClientStdio } from '@/lib/mcp/client'
import { ConversationState } from '../state'

// Runtime function to select appropriate client based on environment
function getMcpClient() {
  // Vercel sets multiple env vars, check for any of them
  const isVercel = process.env.VERCEL === '1' ||
                   process.env.VERCEL_ENV !== undefined ||
                   process.env.NEXT_RUNTIME === 'edge' ||
                   process.env.VERCEL_URL !== undefined

  console.log('[Property Lookup] Environment check:', {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    isVercel
  })

  return isVercel ? mcpClientServerless : mcpClientStdio
}

export async function propertyLookupNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  if (!state.customer_address) {
    throw new Error('Address required for property lookup')
  }

  try {
    // Call MCP property lookup server via MCP client (select at runtime)
    const mcpClient = getMcpClient()
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
