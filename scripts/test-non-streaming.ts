import { prisma } from '../src/lib/prisma'

async function testNonStreaming() {
  console.log('🧪 Testing VAPI Non-Streaming Endpoint (Backwards Compatibility)')
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

  // Test non-streaming request (stream: false or omitted)
  const nonStreamRequest = {
    model: 'custom-langgraph',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a lawn care business.\n\ntenant_id: ${tenant.id}\ncall_id: test_nonstream_001\ncustomer_phone: +15559876543`,
      },
      {
        role: 'user',
        content: 'What services do you offer?',
      },
    ],
    stream: false, // Explicitly disable streaming
  }

  console.log('📤 Sending non-streaming request...')
  console.log('Request:', JSON.stringify(nonStreamRequest, null, 2))
  console.log()

  try {
    const response = await fetch('http://localhost:3000/api/vapi-llm/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nonStreamRequest),
    })

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
      const text = await response.text()
      console.error('Response:', text)
      process.exit(1)
    }

    console.log('✅ Response received (status 200)')
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log()

    // Parse JSON response
    const json = await response.json()
    console.log('📥 Response:', JSON.stringify(json, null, 2))
    console.log()

    // Validate OpenAI format
    if (json.id && json.object === 'chat.completion' && json.choices && json.choices.length > 0) {
      console.log('✅ Valid OpenAI chat completion format')
      console.log('✅ Assistant message:', json.choices[0].message.content)
    } else {
      console.error('❌ Invalid response format')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }

  console.log('\n================================================================================')
  console.log('✅ Test completed successfully!')
}

testNonStreaming()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
