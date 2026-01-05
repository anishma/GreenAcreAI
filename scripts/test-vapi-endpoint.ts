#!/usr/bin/env tsx
/**
 * Test script for VAPI LLM endpoint
 * Tests the API endpoint that VAPI will call
 */

import axios from 'axios'

async function testVAPIEndpoint() {
  console.log('=== Testing VAPI LLM Endpoint ===\n')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const endpoint = `${baseUrl}/api/vapi-llm`

  // Get tenant ID from user input or environment
  const tenantId = process.env.TEST_TENANT_ID

  if (!tenantId) {
    console.error('❌ Please set TEST_TENANT_ID environment variable')
    console.error('   Example: TEST_TENANT_ID=your-tenant-id npm run test:vapi')
    process.exit(1)
  }

  console.log(`Testing endpoint: ${endpoint}`)
  console.log(`Using tenant ID: ${tenantId}\n`)

  // Simulate VAPI request format
  const vapiRequests = [
    {
      description: 'Initial greeting',
      request: {
        message: {
          role: 'user',
          content: 'Hi, I need help with lawn mowing',
        },
        call: {
          id: `test_call_${Date.now()}`,
          customer: {
            number: '+15551234567',
          },
        },
        model: {
          metadata: {
            tenant_id: tenantId,
          },
        },
      },
    },
    {
      description: 'Provide address',
      request: {
        message: {
          role: 'user',
          content: '123 Main Street, Springfield, IL 62701',
        },
        call: {
          id: `test_call_${Date.now()}`,
          customer: {
            number: '+15551234567',
          },
        },
        model: {
          metadata: {
            tenant_id: tenantId,
          },
        },
      },
    },
  ]

  for (const { description, request } of vapiRequests) {
    console.log(`\n--- ${description} ---`)
    console.log(`USER: "${request.message.content}"`)

    try {
      const response = await axios.post(endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.data.message) {
        console.log(`✓ ASSISTANT: "${response.data.message.content}"`)
      } else {
        console.log('✓ Response received:', response.data)
      }
    } catch (error: any) {
      console.error('✗ Request failed:')
      if (error.response) {
        console.error(`Status: ${error.response.status}`)
        console.error('Response:', error.response.data)
      } else {
        console.error(error.message)
      }
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log('\n=== VAPI Endpoint Test Complete ===')
}

async function main() {
  try {
    console.log('Starting VAPI Endpoint Tests...\n')
    console.log('Prerequisites:')
    console.log('1. Next.js dev server running (npm run dev)')
    console.log('2. MCP servers running (npm run mcp:start)')
    console.log('3. TEST_TENANT_ID environment variable set')
    console.log('4. Complete onboarding for the tenant\n')
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...')

    await new Promise((resolve) => setTimeout(resolve, 3000))

    await testVAPIEndpoint()
  } catch (error) {
    console.error('\n=== Test Failed ===')
    console.error(error)
    process.exit(1)
  }
}

main()
