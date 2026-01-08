#!/usr/bin/env tsx
import { mcpClient } from '../src/lib/mcp/client'

async function main() {
  console.log('Testing Property Lookup MCP Server...\n')
  
  try {
    console.log('Calling lookup_property with Dallas address...')
    const result = await mcpClient.callTool(
      'property-lookup',
      'lookup_property',
      {
        street: '1200 Main Street',
        city: 'Dallas',
        state: 'TX',
        zip: '75202',
      }
    )
    console.log('✓ Property lookup successful:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error('✗ Property lookup failed:')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    if (error.cause) {
      console.error('Error cause:', error.cause)
    }
  }

  process.exit(0)
}

main()
