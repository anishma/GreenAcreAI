/**
 * Debug Test for Intent Routing
 *
 * Tests the intent router flow with detailed logging
 */

import { prisma } from '../src/lib/prisma'

const ENDPOINT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CUSTOM_LLM_URL = `${ENDPOINT_URL}/api/vapi-llm/chat/completions`

async function testIntentRouting() {
  console.log('🧪 Testing Intent Routing Flow')
  console.log('=' .repeat(80))

  // Get existing tenant
  const tenant = await prisma.tenants.findFirst({
    where: {
      status: 'active',
      onboarding_completed: true,
    },
  })

  if (!tenant) {
    throw new Error('No active tenant found')
  }

  console.log(`✅ Using tenant: ${tenant.id} (${tenant.business_name})\n`)

  // Test 1: General Question (should trigger FAQ)
  console.log('📤 Test: "What services do you offer?"')
  const response1 = await fetch(CUSTOM_LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_intent_001
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'What services do you offer?',
        },
      ],
    }),
  })

  const data1 = await response1.json()
  console.log('📥 Response:', data1.choices[0].message.content)
  console.log('')

  // Check conversation state in database
  const conversation = await prisma.conversations.findUnique({
    where: { call_id: 'test_intent_001' },
  })

  console.log('💾 Conversation State:')
  console.log('  - Stage:', conversation?.current_stage)
  console.log('  - Messages:', JSON.stringify(conversation?.conversation_history, null, 2))
  console.log('')

  // Test 2: Follow-up to see if it stays conversational
  console.log('📤 Follow-up: "Yes, I would like a quote"')
  const response2 = await fetch(CUSTOM_LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'custom-langgraph',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.

tenant_id: ${tenant.id}
call_id: test_intent_001
customer_phone: +15559876543`,
        },
        {
          role: 'user',
          content: 'Yes, I would like a quote',
        },
      ],
    }),
  })

  const data2 = await response2.json()
  console.log('📥 Response:', data2.choices[0].message.content)
  console.log('')

  // Clean up test conversation
  await prisma.conversations.delete({
    where: { call_id: 'test_intent_001' },
  })

  console.log('✅ Test complete')
}

async function main() {
  try {
    await testIntentRouting()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
