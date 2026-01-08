#!/usr/bin/env tsx
/**
 * Test script for Phase 4 Critical Fixes
 * Tests:
 * 1. Customer name extraction
 * 2. Large lot custom quote detection
 */

import 'dotenv/config'
import { conversationGraph } from '../src/lib/agents/conversation-graph'
import { ConversationState } from '../src/lib/agents/state'
import { prisma } from '../src/lib/prisma'

async function testCustomerNameExtraction() {
  console.log('\n=== TEST 1: Customer Name Extraction ===\n')

  const tenant = await prisma.tenants.findFirst({
    where: { onboarding_completed: true },
  })

  if (!tenant) {
    console.error('❌ No tenants found')
    return
  }

  // Test case: User introduces themselves with name
  const conversationTurns = [
    {
      description: 'User introduces themselves with name',
      userMessage: "Hi, I'm Sarah Johnson and I need a lawn mowing quote",
    },
    {
      description: 'User provides address',
      userMessage: '1200 Main Street, Dallas, TX 75202',
    },
    {
      description: 'User chooses weekly service',
      userMessage: 'Weekly service please',
    },
    {
      description: 'User declines booking',
      userMessage: 'No thanks, just wanted the quote',
    },
  ]

  let state: ConversationState = {
    messages: [],
    tenant_id: tenant.id,
    call_id: `test_name_${Date.now()}`,
    stage: 'greeting',
    attempts: {
      address_extraction: 0,
      property_lookup: 0,
    },
  }

  for (const turn of conversationTurns) {
    console.log(`\n🧑 ${turn.description}`)
    console.log(`USER: "${turn.userMessage}"`)

    state.messages.push({
      role: 'user',
      content: turn.userMessage,
    })

    const result = await conversationGraph.invoke(state)
    state = result

    const lastAssistantMessage = result.messages
      .filter((m: any) => m.role === 'assistant')
      .pop()

    if (lastAssistantMessage) {
      console.log(`🤖 ASSISTANT: "${lastAssistantMessage.content}"`)
    }

    console.log(`📊 Stage: ${result.stage}`)
    if (result.customer_name) {
      console.log(`👤 Customer Name: ${result.customer_name}`)
    }
    if (result.customer_address) {
      console.log(
        `📍 Address: ${result.customer_address.street}, ${result.customer_address.city}`
      )
    }
  }

  // Verify name was captured
  if (state.customer_name === 'Sarah Johnson') {
    console.log('\n✅ Customer name extracted successfully!')
  } else {
    console.log(
      `\n❌ Customer name extraction failed. Got: "${state.customer_name}"`
    )
  }
}

async function testLargeLotCustomQuote() {
  console.log('\n\n=== TEST 2: Large Lot Custom Quote Detection ===\n')

  const tenant = await prisma.tenants.findFirst({
    where: { onboarding_completed: true },
  })

  if (!tenant) {
    console.error('❌ No tenants found')
    return
  }

  console.log('Testing with a property that should exceed max tier...')
  console.log('(This test requires Regrid API access)\n')

  // Use an address that will have a very large lot
  // For testing, we'll simulate by checking the error handling
  const conversationTurns = [
    {
      description: 'User requests quote',
      userMessage: 'I need a quote for lawn mowing',
    },
    {
      description: 'User provides address for large property',
      userMessage: '1500 Country Club Drive, Dallas, TX 75229', // Likely large lot
    },
    {
      description: 'User chooses weekly',
      userMessage: 'Weekly',
    },
  ]

  let state: ConversationState = {
    messages: [],
    tenant_id: tenant.id,
    call_id: `test_large_${Date.now()}`,
    stage: 'greeting',
    attempts: {
      address_extraction: 0,
      property_lookup: 0,
    },
  }

  for (const turn of conversationTurns) {
    console.log(`\n🧑 ${turn.description}`)
    console.log(`USER: "${turn.userMessage}"`)

    state.messages.push({
      role: 'user',
      content: turn.userMessage,
    })

    const result = await conversationGraph.invoke(state)
    state = result

    const lastAssistantMessage = result.messages
      .filter((m: any) => m.role === 'assistant')
      .pop()

    if (lastAssistantMessage) {
      console.log(`🤖 ASSISTANT: "${lastAssistantMessage.content}"`)
    }

    console.log(`📊 Stage: ${result.stage}`)
    if (result.property_data) {
      console.log(
        `🏡 Property: ${result.property_data.lot_size_sqft} sqft (${(result.property_data.lot_size_sqft / 43560).toFixed(2)} acres)`
      )
    }

    // Check if custom quote message was triggered
    if (
      lastAssistantMessage?.content.includes('custom quote') ||
      lastAssistantMessage?.content.includes('owner call you')
    ) {
      console.log('\n✅ Large lot custom quote detection working!')
    }
  }

  console.log(
    '\n💡 Note: If property lookup failed or lot size is within standard tiers,'
  )
  console.log('   the custom quote message may not trigger.')
}

async function testNameExtractWithAddress() {
  console.log('\n\n=== TEST 3: Name + Address in Single Message ===\n')

  const tenant = await prisma.tenants.findFirst({
    where: { onboarding_completed: true },
  })

  if (!tenant) {
    console.error('❌ No tenants found')
    return
  }

  const conversationTurns = [
    {
      description: 'Initial greeting',
      userMessage: 'Hello, I need lawn service',
    },
    {
      description: 'User provides name AND address together',
      userMessage:
        "I'm Michael Davis at 1200 Main Street, Dallas, Texas, 75202",
    },
    {
      description: 'User chooses biweekly',
      userMessage: 'Biweekly sounds good',
    },
  ]

  let state: ConversationState = {
    messages: [],
    tenant_id: tenant.id,
    call_id: `test_combo_${Date.now()}`,
    stage: 'greeting',
    attempts: {
      address_extraction: 0,
      property_lookup: 0,
    },
  }

  for (const turn of conversationTurns) {
    console.log(`\n🧑 ${turn.description}`)
    console.log(`USER: "${turn.userMessage}"`)

    state.messages.push({
      role: 'user',
      content: turn.userMessage,
    })

    const result = await conversationGraph.invoke(state)
    state = result

    const lastAssistantMessage = result.messages
      .filter((m: any) => m.role === 'assistant')
      .pop()

    if (lastAssistantMessage) {
      console.log(`🤖 ASSISTANT: "${lastAssistantMessage.content}"`)
    }

    console.log(`📊 Stage: ${result.stage}`)
    if (result.customer_name) {
      console.log(`👤 Customer Name: ${result.customer_name}`)
    }
    if (result.customer_address) {
      console.log(
        `📍 Address: ${result.customer_address.street}, ${result.customer_address.city}`
      )
    }
  }

  // Verify both name and address were captured
  if (state.customer_name === 'Michael Davis' && state.customer_address) {
    console.log('\n✅ Name and address both extracted successfully!')
  } else {
    console.log(
      `\n❌ Failed to extract both. Name: "${state.customer_name}", Address: ${state.customer_address ? 'Yes' : 'No'}`
    )
  }
}

async function main() {
  try {
    console.log('🧪 Testing Phase 4 Critical Fixes...')
    console.log('=' .repeat(60))

    await testCustomerNameExtraction()
    await testNameExtractWithAddress()
    await testLargeLotCustomQuote()

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests completed!\n')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
