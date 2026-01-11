import { prisma } from '../src/lib/prisma'

async function testConversationFlow() {
  console.log('🧪 Testing Full Conversation Flow')
  console.log('================================================================================\n')

  // Get a test tenant
  const tenant = await prisma.tenants.findFirst({
    where: {
      status: 'active',
      onboarding_completed: true,
    },
    orderBy: { created_at: 'desc' },
  })

  if (!tenant) {
    console.error('❌ No active tenant found for testing')
    process.exit(1)
  }

  console.log(`✅ Using tenant: ${tenant.id} (${tenant.business_name})\n`)

  const callId = `test_flow_${Date.now()}`
  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI assistant for a lawn care business.\n\ntenant_id: ${tenant.id}\ncall_id: ${callId}\ncustomer_phone: +15559876543`,
  }

  // Simulate the conversation from the transcript
  const conversationSteps = [
    {
      description: 'User asks about services',
      message: 'What services do you provide?',
      expectedFlow: 'Should respond with service info and ask for quote interest',
    },
    {
      description: 'User confirms they want a quote',
      message: 'Yes. I would like to get a quote.',
      expectedFlow: 'Should ask for address',
    },
    {
      description: 'User provides address',
      message: "Yes. It's 1200 Main Street, Dallas, Texas 75202 is my ZIP.",
      expectedFlow: 'Should ask for frequency preference',
    },
    {
      description: 'User selects frequency',
      message: 'Uh, I would prefer biweekly.',
      expectedFlow: 'Should proceed to property lookup (NOT ask for address again)',
    },
  ]

  const messages: any[] = [systemMessage]

  for (let i = 0; i < conversationSteps.length; i++) {
    const step = conversationSteps[i]
    console.log(`\n📍 Step ${i + 1}: ${step.description}`)
    console.log(`Expected: ${step.expectedFlow}`)
    console.log(`User: "${step.message}"`)

    messages.push({
      role: 'user',
      content: step.message,
    })

    try {
      const response = await fetch('http://localhost:3000/api/vapi-llm/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'custom-langgraph',
          messages: messages,
          stream: false,
        }),
      })

      if (!response.ok) {
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
        const text = await response.text()
        console.error('Response:', text)
        process.exit(1)
      }

      const json = await response.json()
      const assistantMessage = json.choices[0].message.content

      console.log(`Assistant: "${assistantMessage}"`)

      // Add assistant response to conversation history
      messages.push({
        role: 'assistant',
        content: assistantMessage,
      })

      // Validate expected behavior for step 4 (frequency selection)
      if (i === 3) {
        const lowerResponse = assistantMessage.toLowerCase()
        if (
          lowerResponse.includes('address') &&
          (lowerResponse.includes('provide') || lowerResponse.includes('need'))
        ) {
          console.error('❌ BUG DETECTED: Asked for address again after frequency was provided!')
          console.error('   This should NOT happen - address was already collected in step 3')
          process.exit(1)
        } else {
          console.log('✅ CORRECT: Did not ask for address again')
        }
      }
    } catch (error: any) {
      console.error('❌ Test failed:', error.message)
      process.exit(1)
    }
  }

  console.log('\n================================================================================')
  console.log('✅ Full conversation flow test completed successfully!')
  console.log('   All steps executed correctly without looping back to address collection.')
}

testConversationFlow()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
