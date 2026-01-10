#!/usr/bin/env node
import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { getAvailableSlotsTool } from './tools/get-available-slots.js'
import { bookAppointmentTool } from './tools/book-appointment.js'
import { cancelAppointmentTool } from './tools/cancel-appointment.js'

// Create MCP server
const server = new Server(
  {
    name: 'calendar-server',
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
        name: 'get_available_slots',
        description: 'Get available appointment slots from the calendar',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
            start_date: { type: 'string', description: 'Start date in ISO format' },
            end_date: { type: 'string', description: 'End date in ISO format' },
          },
          required: ['tenant_id', 'start_date', 'end_date'],
        },
      },
      {
        name: 'book_appointment',
        description: 'Book an appointment in the calendar',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
            start_time: { type: 'string', description: 'Appointment start time in ISO format' },
            customer_name: { type: 'string', description: 'Customer name' },
            customer_phone: { type: 'string', description: 'Customer phone number' },
            property_address: { type: 'string', description: 'Property address' },
            estimated_price: { type: 'number', description: 'Estimated price for the service' },
          },
          required: ['tenant_id', 'start_time', 'customer_name', 'customer_phone', 'property_address', 'estimated_price'],
        },
      },
      {
        name: 'cancel_appointment',
        description: 'Cancel an appointment in the calendar',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', description: 'Tenant ID' },
            calendar_event_id: { type: 'string', description: 'Google Calendar event ID' },
          },
          required: ['tenant_id', 'calendar_event_id'],
        },
      },
    ],
  }
})

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  // Validate that arguments exist
  if (!args) {
    throw new Error(`Missing arguments for tool: ${name}`)
  }

  if (name === 'get_available_slots') {
    // Parse and validate arguments with Zod schema
    const validatedArgs = getAvailableSlotsTool.input_schema.parse(args)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await getAvailableSlotsTool.handler(validatedArgs)),
        },
      ],
    }
  }

  if (name === 'book_appointment') {
    // Parse and validate arguments with Zod schema
    const validatedArgs = bookAppointmentTool.input_schema.parse(args)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await bookAppointmentTool.handler(validatedArgs)),
        },
      ],
    }
  }

  if (name === 'cancel_appointment') {
    // Parse and validate arguments with Zod schema
    const validatedArgs = cancelAppointmentTool.input_schema.parse(args)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(await cancelAppointmentTool.handler(validatedArgs)),
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
  console.error('Calendar MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
