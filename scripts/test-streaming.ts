import { prisma } from '../src/lib/prisma'

async function testStreaming() {
  console.log('🧪 Testing VAPI Streaming Endpoint')
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

  // Test streaming request
  const streamRequest = {
    model: 'custom-langgraph',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a lawn care business.\n\ntenant_id: ${tenant.id}\ncall_id: test_streaming_001\ncustomer_phone: +15559876543`,
      },
      {
        role: 'user',
        content: 'What services do you offer?',
      },
    ],
    stream: true, // Enable streaming
  }

  console.log('📤 Sending streaming request...')
  console.log('Request:', JSON.stringify(streamRequest, null, 2))
  console.log()

  try {
    const response = await fetch('http://localhost:3000/api/vapi-llm/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(streamRequest),
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

    // Check if streaming
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('text/event-stream')) {
      console.log('✅ Streaming response detected!')
      console.log('📥 Stream chunks:\n')

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            chunkCount++
            const data = line.slice(6)
            console.log(`Chunk ${chunkCount}:`, data)
          }
        }
      }

      console.log()
      console.log(`✅ Received ${chunkCount} chunks`)
    } else {
      console.log('❌ Non-streaming response (expected text/event-stream)')
      const json = await response.json()
      console.log('Response:', JSON.stringify(json, null, 2))
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }

  console.log('\n================================================================================')
  console.log('✅ Test completed successfully!')
}

testStreaming()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
