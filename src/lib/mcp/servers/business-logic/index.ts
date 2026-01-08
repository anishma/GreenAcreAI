#!/usr/bin/env node
import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { calculateQuoteTool } from './tools/calculate-quote.js'
import { validateServiceAreaTool } from './tools/validate-service-area.js'
import { getGenericPriceRangeTool } from './tools/get-generic-price-range.js'

// Create MCP server
const server = new Server(
  {
    name: 'business-logic-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'calculate_quote',
        description: 'Calculate pricing quote based on lot size and tenant pricing tiers',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
            lot_size_sqft: { type: 'number', description: 'Lot size in square feet' },
            frequency: {
              type: 'string',
              enum: ['weekly', 'biweekly'],
              description: 'Service frequency',
              default: 'weekly'
            },
          },
          required: ['tenant_id', 'lot_size_sqft'],
        },
      },
      {
        name: 'validate_service_area',
        description: 'Check if a ZIP code is in the tenant service area',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
            zip: { type: 'string', description: '5-digit ZIP code' },
          },
          required: ['tenant_id', 'zip'],
        },
      },
      {
        name: 'get_generic_price_range',
        description: 'Get a generic price range for services when lot size is unknown',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
          },
          required: ['tenant_id'],
        },
      },
    ],
  }
})

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'calculate_quote') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await calculateQuoteTool.handler(args)),
        },
      ],
    }
  }

  if (name === 'validate_service_area') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await validateServiceAreaTool.handler(args)),
        },
      ],
    }
  }

  if (name === 'get_generic_price_range') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await getGenericPriceRangeTool.handler(args)),
        },
      ],
    }
  }

  throw new Error(`Unknown tool: ${name}`)
})

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Business Logic MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
