#!/usr/bin/env node
// Node.js 18+ has built-in fetch, no need for node-fetch import

const API_URL = 'http://localhost:3004/api/vapi-llm/chat/completions'

async function testEmptyChannelError() {
  console.log('Testing EmptyChannelError scenario...')

  // Test case that triggers EmptyChannelError:
  // VAPI sends a request with firstMessage already included
  const testRequest = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant for a lawn care business.\nHelp customers with:\n- Getting quotes for services\n- Scheduling appointments\n- Answering questions about services\n- Providing property information\n\nBe friendly, professional, and concise.\ntenant_id: 182557c2-22e6-4577-b2a6-9c6681361227\ncall_id: test_empty_channel_error\ncustomer_phone: f2172f20-cdd1-41c3-8417-3573dec828ea"
      },
      {
        role: "assistant",
        content: "Hello. Thank you for calling Mike's Lawn Care. How can I help you today?"
      },
      {
        role: "user",
        content: "What services do you provide?"
      }
    ],
    temperature: 0,
    tools: [
      {
        type: "function",
        function: {
          name: "endCall",
          description: "Use this function to end the call.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ],
    max_tokens: 250,
    call: {
      id: "test_empty_channel_error",
      orgId: "082b473b-00db-404d-9fb8-2fb5c0a9c315",
      customer: {
        number: "+16144409180"
      }
    },
    stream: false
  }

  try {
    console.log('Sending request to:', API_URL)
    console.log('Request body:', JSON.stringify(testRequest, null, 2))

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ ERROR Response:', response.status, result)
    } else {
      console.log('✅ SUCCESS Response:', JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

// Run the test
testEmptyChannelError()