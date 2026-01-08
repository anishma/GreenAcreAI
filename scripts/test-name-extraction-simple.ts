#!/usr/bin/env tsx
/**
 * Simple test for name extraction in greeting node
 */

import 'dotenv/config'
import { conversationGraph } from '../src/lib/agents/conversation-graph'
import { ConversationState } from '../src/lib/agents/state'
import { prisma } from '../src/lib/prisma'

async function testNameInGreeting() {
  console.log('=== Testing Name Extraction in Greeting ===\n')

  const tenant = await prisma.tenants.findFirst({
    where: { onboarding_completed: true },
  })

  if (!tenant) {
    console.error('❌ No tenants found')
    process.exit(1)
  }

  let state: ConversationState = {
    messages: [],
    tenant_id: tenant.id,
    call_id: `test_${Date.now()}`,
    stage: 'greeting',
    attempts: {
      address_extraction: 0,
      property_lookup: 0,
    },
  }

  // Turn 1: User introduces themselves
  console.log('TURN 1: User says "Hi, I\'m Sarah Johnson and I need a lawn mowing quote"\n')
  state.messages.push({
    role: 'user',
    content: "Hi, I'm Sarah Johnson and I need a lawn mowing quote",
  })

  const result1 = await conversationGraph.invoke(state)
  state = result1

  console.log('After Turn 1:')
  console.log(`  Stage: ${state.stage}`)
  console.log(`  Customer Name: ${state.customer_name || 'NOT SET'}`)
  console.log(`  Messages count: ${state.messages.length}`)

  const lastMsg = state.messages[state.messages.length - 1]
  if (lastMsg?.role === 'assistant') {
    console.log(`  Assistant said: "${lastMsg.content.substring(0, 80)}..."`)
  }

  // Turn 2: User provides address
  console.log('\nTURN 2: User provides address "1200 Main Street, Dallas, TX 75202"\n')
  state.messages.push({
    role: 'user',
    content: '1200 Main Street, Dallas, TX 75202',
  })

  const result2 = await conversationGraph.invoke(state)
  state = result2

  console.log('After Turn 2:')
  console.log(`  Stage: ${state.stage}`)
  console.log(`  Customer Name: ${state.customer_name || 'NOT SET'}`)
  console.log(`  Address: ${state.customer_address ? `${state.customer_address.street}, ${state.customer_address.city}` : 'NOT SET'}`)

  // Final check
  console.log('\n' + '='.repeat(60))
  if (state.customer_name === 'Sarah Johnson') {
    console.log('✅ SUCCESS: Customer name extracted correctly!')
  } else {
    console.log(`❌ FAILED: Expected "Sarah Johnson", got "${state.customer_name}"`)
  }

  await prisma.$disconnect()
}

testNameInGreeting().catch(console.error)
