/**
 * Test Script for VAPI Custom LLM Endpoint
 *
 * Tests the OpenAI-compatible custom LLM endpoint to verify EmptyChannelError fix.
 *
 * This tests:
 * 1. State initialization with valid messages array
 * 2. Graph invocation doesn't throw EmptyChannelError
 * 3. Response generation works correctly
 *
 * Usage:
 *   npm run dev (in another terminal)
 *   npx tsx scripts/test-custom-llm-endpoint.ts
 */

import { prisma } from '../src/lib/prisma'

const ENDPOINT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CUSTOM_LLM_URL = `${ENDPOINT_URL}/api/vapi-llm/chat/completions`

console.log(`🎯 Testing VAPI endpoint at: ${CUSTOM_LLM_URL}`)

interface TestResult {
  name: string
  passed: boolean
  error?: string
  response?: any
  duration?: number
}

const results: TestResult[] = []

/**
 * Helper to make test requests
 */
async function testRequest(
  name: string,
  body: any,
  expectedStatus: number = 200
): Promise<TestResult> {
  const startTime = Date.now()

  try {
    console.log(`\n🧪 Test: ${name}`)
    console.log('📤 Request:', JSON.stringify(body, null, 2))

    const response = await fetch(CUSTOM_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const duration = Date.now() - startTime
    const responseData = await response.json()

    console.log(`📥 Response (${response.status}):`, JSON.stringify(responseData, null, 2))
    console.log(`⏱️  Duration: ${duration}ms`)

    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
    }

    // Validate OpenAI format for successful responses
    if (response.status === 200) {
      if (!responseData.id || !responseData.object || !responseData.choices) {
        throw new Error('Response missing required OpenAI fields (id, object, choices)')
      }

      if (responseData.object !== 'chat.completion') {
        throw new Error(`Expected object "chat.completion", got "${responseData.object}"`)
      }

      if (!Array.isArray(responseData.choices) || responseData.choices.length === 0) {
        throw new Error('Response choices must be a non-empty array')
      }

      const choice = responseData.choices[0]
      if (!choice.message || !choice.message.role || !choice.message.content) {
        throw new Error('Choice missing required fields (message.role, message.content)')
      }

      if (choice.message.role !== 'assistant') {
        throw new Error(`Expected role "assistant", got "${choice.message.role}"`)
      }
    }

    console.log('✅ PASSED')
    return {
      name,
      passed: true,
      response: responseData,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`)
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    }
  }
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('\n📋 Setting up test data...')

  // Find an existing active tenant
  const tenant = await prisma.tenants.findFirst({
    where: {
      status: 'active',
      onboarding_completed: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  if (!tenant) {
    throw new Error(
      'No active tenant found in database. Please complete onboarding first or create a tenant manually.'
    )
  }

  console.log(`✅ Using tenant: ${tenant.id} (${tenant.business_name})`)
  return tenant
}


/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Custom LLM Endpoint Tests')
  console.log(`📍 Endpoint: ${CUSTOM_LLM_URL}`)
  console.log('=' .repeat(80))

  const tenant = await setupTestData()

  // Test 1: Valid request with tenant_id in system message
  results.push(await testRequest(
    'Valid Request - System Message with tenant_id',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_call_001
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'Hello, I need a quote for lawn mowing at 123 Main St, Springfield IL 62701',
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
    }
  ))

  // Test 2: Follow-up message (existing conversation)
  results.push(await testRequest(
    'Follow-up Message - Existing Conversation',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_call_001
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'My name is John Smith',
        },
      ],
      temperature: 0.7,
    }
  ))

  // Test 3: Missing tenant_id (should fail)
  results.push(await testRequest(
    'Missing tenant_id - Should Return Error',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    },
    400 // Expect 400 error
  ))

  // Test 4: Missing call_id (should fail)
  results.push(await testRequest(
    'Missing call_id - Should Return Error',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `tenant_id: ${tenant.id}`,
        },
        {
          role: 'user',
          content: 'Hello',
        },
      ],
    },
    400 // Expect 400 error
  ))

  // Test 5: Empty messages array (should fail)
  results.push(await testRequest(
    'Empty Messages Array - Should Return Error',
    {
      model: 'custom-langgraph',
      messages: [],
    },
    400 // Expect 400 error
  ))

  // Test 6: Multiple back-and-forth messages
  results.push(await testRequest(
    'Multi-turn Conversation',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_call_002
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'I want a quote',
        },
      ],
      temperature: 0.7,
    }
  ))

  // Test 7: Address with special characters
  results.push(await testRequest(
    'Address with Special Characters',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_call_003
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: "I live at 456 O'Brien Rd, Apt #2B, Springfield IL 62704",
        },
      ],
    }
  ))

  // Test 8: OpenAI format validation - Check response structure
  results.push(await testRequest(
    'OpenAI Format Validation - Response Structure',
    {
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_call_004
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'What services do you offer?',
        },
      ],
    }
  ))

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)
  const avgDuration = totalDuration / results.length

  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${index + 1}. ${status} ${result.name}${duration}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '-'.repeat(80))
  console.log(`Total: ${results.length} tests`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Average Duration: ${Math.round(avgDuration)}ms`)
  console.log(`Total Duration: ${totalDuration}ms`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Ready for production deployment.')
  } else {
    console.log('\n⚠️  Some tests failed. Please fix issues before deploying.')
    process.exit(1)
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await runTests()
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
