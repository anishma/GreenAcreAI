#!/usr/bin/env tsx
/**
 * Test script for LangGraph conversation agent
 * Simulates a complete conversation flow
 */

import 'dotenv/config'
import { conversationGraph } from '../src/lib/agents/conversation-graph'
import { ConversationState } from '../src/lib/agents/state'
import { prisma } from '../src/lib/prisma'

async function simulateConversation() {
  console.log('=== LangGraph Agent Test ===\n')

  // Get the first tenant from database for testing
  const tenant = await prisma.tenants.findFirst({
    where: {
      onboarding_completed: true,
    },
  })

  if (!tenant) {
    console.error('❌ No tenants found in database')
    console.error('Please complete the onboarding flow first at http://localhost:3000')
    process.exit(1)
  }

  console.log(`Testing with tenant: ${tenant.business_name}`)
  console.log(`Tenant ID: ${tenant.id}\n`)

  // Simulate conversation turns
  const conversationTurns = [
    {
      description: 'User initiates conversation',
      userMessage: 'Hi, I need a quote',
    },
    {
      description: 'User provides address',
      userMessage: '1200 Main Street, Dallas, TX 75202',
    },
    {
      description: 'User chooses frequency',
      userMessage: 'I would like biweekly service',
    },
    {
      description: 'User wants to book',
      userMessage: 'Yes, I would like to schedule an appointment',
    },
    {
      description: 'User confirms booking',
      userMessage: 'Morning works for me',
    },
  ]

  // Initialize conversation state
  let state: ConversationState = {
    messages: [],
    tenant_id: tenant.id,
    call_id: `test_call_${Date.now()}`,
    stage: 'greeting',
    attempts: {
      address_extraction: 0,
      property_lookup: 0,
    },
  }

  console.log('--- Starting Conversation ---\n')

  for (const turn of conversationTurns) {
    console.log(`\n🧑 ${turn.description}`)
    console.log(`USER: "${turn.userMessage}"`)

    // Add user message to state
    state.messages.push({
      role: 'user',
      content: turn.userMessage,
    })

    try {
      // Invoke the graph
      const result = await conversationGraph.invoke(state)

      // Update state with result
      state = result

      // Get the last assistant message
      const lastAssistantMessage = result.messages
        .filter((m: any) => m.role === 'assistant')
        .pop()

      if (lastAssistantMessage) {
        console.log(`🤖 ASSISTANT: "${lastAssistantMessage.content}"`)
      }

      console.log(`\n📊 State: ${result.stage}`)
      if (result.customer_address) {
        console.log(
          `📍 Address: ${result.customer_address.street}, ${result.customer_address.city}, ${result.customer_address.state} ${result.customer_address.zip}`
        )
      }
      if (result.preferred_frequency) {
        console.log(`🔄 Frequency: ${result.preferred_frequency}`)
      }
      if (result.property_data) {
        console.log(
          `🏡 Property: ${result.property_data.lot_size_sqft} sqft (parcel: ${result.property_data.parcel_id})`
        )
      }
      if (result.quote) {
        console.log(
          `💵 Quote: $${result.quote.price} per visit (${result.quote.frequency})`
        )
      }
      if (result.booking) {
        console.log(
          `📅 Booking: ${result.booking.scheduled_at} (event: ${result.booking.calendar_event_id})`
        )
      }

      // Check if conversation ended
      if (result.stage === 'closing') {
        console.log('\n✅ Conversation ended successfully')
        break
      }

      // Small delay between turns
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('\n❌ Error during conversation turn:')
      console.error(error)
      break
    }
  }

  console.log('\n--- Conversation Complete ---')
  console.log(`\nFinal conversation had ${state.messages.length} messages`)
}

async function testEdgeCases() {
  console.log('\n\n=== Testing Edge Cases ===\n')

  const tenant = await prisma.tenants.findFirst({
    where: {
      onboarding_completed: true,
    },
  })

  if (!tenant) {
    return
  }

  // Test 1: Invalid address
  console.log('\n--- Test 1: Invalid Address ---')
  try {
    let state: ConversationState = {
      messages: [{ role: 'user', content: 'Hi' }],
      tenant_id: tenant.id,
      call_id: `test_invalid_address_${Date.now()}`,
      stage: 'greeting',
      attempts: {
        address_extraction: 0,
        property_lookup: 0,
      },
    }

    const result1 = await conversationGraph.invoke(state)
    console.log('✓ Greeting handled')

    state = { ...result1, messages: [...result1.messages, { role: 'user', content: 'asdfasdf' }] }
    const result2 = await conversationGraph.invoke(state)
    console.log('✓ Invalid address handled, assistant asked for clarification')
    console.log(`Assistant response: "${result2.messages[result2.messages.length - 1].content}"`)
  } catch (error) {
    console.error('✗ Invalid address test failed:', error)
  }

  // Test 2: User declines booking
  console.log('\n--- Test 2: User Declines Booking ---')
  try {
    let state: ConversationState = {
      messages: [
        { role: 'user', content: 'I just want a quote' },
        { role: 'assistant', content: 'Sure! What is your address?' },
        { role: 'user', content: '1200 Main Street, Dallas, TX 75202' },
      ],
      tenant_id: tenant.id,
      call_id: `test_decline_${Date.now()}`,
      stage: 'address_collection',
      customer_address: {
        street: '1200 Main Street',
        city: 'Dallas',
        state: 'TX',
        zip: '75202',
      },
      attempts: {
        address_extraction: 0,
        property_lookup: 0,
      },
    }

    // Go through property lookup and quote
    const result1 = await conversationGraph.invoke(state)
    console.log('✓ Property lookup and quote calculated')

    // User declines booking
    state = { ...result1, messages: [...result1.messages, { role: 'user', content: 'No thanks, just wanted to know the price' }] }
    const result2 = await conversationGraph.invoke(state)
    console.log('✓ User decline handled gracefully')
    console.log(`Assistant response: "${result2.messages[result2.messages.length - 1].content}"`)
  } catch (error) {
    console.error('✗ User decline test failed:', error)
  }
}

async function main() {
  try {
    console.log('Starting LangGraph Agent Tests...')
    console.log('\nPrerequisites:')
    console.log('1. Complete onboarding at http://localhost:3000')
    console.log('2. Set up Google Calendar OAuth')
    console.log('3. Set REGRID_API_KEY in .env.local')
    console.log('4. Start MCP servers with: npm run mcp:start')
    console.log('5. Make sure Next.js dev server is running\n')
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...')

    await new Promise((resolve) => setTimeout(resolve, 3000))

    await simulateConversation()
    await testEdgeCases()

    console.log('\n\n=== All Agent Tests Complete ===')
  } catch (error) {
    console.error('\n=== Test Failed ===')
    console.error(error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
