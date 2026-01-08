#!/usr/bin/env node
import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { lookupPropertyTool } from './tools/lookup-property.js'

// Create MCP server
const server = new Server(
  {
    name: 'property-lookup-server',
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
        name: 'lookup_property',
        description: 'Look up property lot size and details by address',
        inputSchema: {
          type: 'object',
          properties: {
            street: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: '2-letter state code' },
            zip: { type: 'string', description: '5-digit ZIP code' },
          },
          required: ['street', 'city', 'state', 'zip'],
        },
      },
    ],
  }
})

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'lookup_property') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await lookupPropertyTool.handler(args)),
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
  console.error('Property Lookup MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
