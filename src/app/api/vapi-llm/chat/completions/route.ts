import { NextRequest, NextResponse } from 'next/server'
import { conversationGraph } from '@/lib/agents/conversation-graph'
import { ConversationState } from '@/lib/agents/state'
import { prisma } from '@/lib/prisma'
import {
  OpenAIChatCompletionRequest,
  extractUserMessage,
  formatOpenAIResponse,
  formatOpenAIErrorResponse,
} from '@/lib/vapi/openai-adapter'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

// VAPI Custom LLM Endpoint (OpenAI-Compatible)
// Receives OpenAI-formatted chat completion requests from VAPI
// Returns OpenAI-formatted responses using our LangGraph agent

export async function POST(req: NextRequest) {
  try {
    console.log('[VAPI LLM] Prisma client:', typeof prisma, prisma ? 'defined' : 'undefined')
    const body: OpenAIChatCompletionRequest = await req.json()

    console.log('[VAPI LLM] Request body:', JSON.stringify(body, null, 2))

    // VAPI sends OpenAI-compatible format:
    // {
    //   "model": "custom-model",
    //   "messages": [
    //     { "role": "system", "content": "..." },
    //     { "role": "user", "content": "123 Main St, Springfield IL 62701" }
    //   ],
    //   "temperature": 0.7,
    //   "stream": true,
    //   "max_tokens": 250
    // }
    //
    // VAPI also includes metadata in headers or custom fields
    // We'll extract tenant_id and call_id from custom metadata

    // Extract custom VAPI metadata (if passed in headers or body)
    const vapiCallId = req.headers.get('x-vapi-call-id')
    const vapiCustomerId = req.headers.get('x-vapi-customer-number')

    // Fallback: Check if metadata is in the messages (system message)
    const systemMessage = body.messages.find(m => m.role === 'system')
    let tenantId: string | null = null
    let callId: string | null = vapiCallId
    let customerPhone: string | null = vapiCustomerId

    // Try to extract from system message if present
    if (systemMessage?.content) {
      const tenantMatch = systemMessage.content.match(/tenant_id:\s*(\S+)/)
      const callMatch = systemMessage.content.match(/call_id:\s*(\S+)/)
      const phoneMatch = systemMessage.content.match(/customer_phone:\s*(\S+)/)

      if (tenantMatch) tenantId = tenantMatch[1]
      if (callMatch) callId = callMatch[1]
      if (phoneMatch) customerPhone = phoneMatch[1]
    }

    if (!tenantId) {
      console.error('[VAPI LLM] Missing tenant_id in request')
      return NextResponse.json(
        formatOpenAIErrorResponse('Configuration error: Missing tenant identifier'),
        { status: 400 }
      )
    }

    if (!callId) {
      console.error('[VAPI LLM] Missing call_id in request')
      return NextResponse.json(
        formatOpenAIErrorResponse('Configuration error: Missing call identifier'),
        { status: 400 }
      )
    }

    // Extract the user's message from the messages array
    const userMessageContent = extractUserMessage(body.messages)

    if (!userMessageContent) {
      console.error('[VAPI LLM] No user message found in request')
      return NextResponse.json(
        formatOpenAIErrorResponse('No message provided'),
        { status: 400 }
      )
    }

    console.log('[VAPI LLM] Processing message:', userMessageContent)
    console.log('[VAPI LLM] Tenant ID:', tenantId)
    console.log('[VAPI LLM] Call ID:', callId)

    // Load or create conversation state from database
    let conversationRecord = await prisma.conversations.findUnique({
      where: { call_id: callId },
    })

    let state: ConversationState

    if (conversationRecord) {
      // Restore existing conversation
      state = {
        messages:
          (conversationRecord.conversation_history as any[]) || [],
        tenant_id: conversationRecord.tenant_id,
        call_id: conversationRecord.call_id,
        customer_phone: conversationRecord.customer_phone || undefined,
        customer_name: conversationRecord.customer_name || undefined,
        customer_address: conversationRecord.customer_address
          ? (conversationRecord.customer_address as any)
          : undefined,
        property_data: conversationRecord.property_data
          ? (conversationRecord.property_data as any)
          : undefined,
        quote: conversationRecord.quote_data
          ? (conversationRecord.quote_data as any)
          : undefined,
        chosen_time: conversationRecord.chosen_time || undefined,
        booking: conversationRecord.booking_data
          ? (conversationRecord.booking_data as any)
          : undefined,
        stage: (conversationRecord.current_stage as any) || 'greeting',
        attempts: conversationRecord.attempts
          ? (conversationRecord.attempts as any)
          : { address_extraction: 0, property_lookup: 0 },
      }

      // Add new user message
      state.messages.push({
        role: 'user',
        content: userMessageContent,
      })
    } else {
      // Create new conversation
      state = {
        messages: [
          {
            role: 'user',
            content: userMessageContent,
          },
        ],
        tenant_id: tenantId,
        call_id: callId,
        customer_phone: customerPhone || undefined,
        stage: 'greeting',
        attempts: {
          address_extraction: 0,
          property_lookup: 0,
        },
      }

      // Create conversation record
      await prisma.conversations.create({
        data: {
          call_id: callId,
          tenant_id: tenantId,
          customer_phone: customerPhone,
          conversation_history: state.messages as any,
          current_stage: state.stage,
          attempts: state.attempts as any,
        },
      })
    }

    // Run the conversation graph
    const result = await conversationGraph.invoke(state)

    // Get the last assistant message
    const lastAssistantMessage = result.messages
      .filter((m: any) => m.role === 'assistant')
      .pop()

    if (!lastAssistantMessage) {
      console.error('[VAPI LLM] No assistant message generated')
      return NextResponse.json(
        formatOpenAIErrorResponse('No response generated'),
        { status: 500 }
      )
    }

    // Save updated conversation state
    await prisma.conversations.update({
      where: { call_id: callId },
      data: {
        conversation_history: result.messages as any,
        current_stage: result.stage,
        customer_name: result.customer_name || null,
        customer_address: result.customer_address
          ? (result.customer_address as any)
          : null,
        property_data: result.property_data
          ? (result.property_data as any)
          : null,
        quote_data: result.quote ? (result.quote as any) : null,
        chosen_time: result.chosen_time || null,
        booking_data: result.booking ? (result.booking as any) : null,
        attempts: result.attempts as any,
        updated_at: new Date(),
      },
    })

    console.log('[VAPI LLM] Response generated:', lastAssistantMessage.content.substring(0, 100))

    // Return response in OpenAI format (REQUIRED by VAPI)
    const openAIResponse = formatOpenAIResponse(
      lastAssistantMessage.content,
      `chatcmpl-${callId}`
    )

    console.log('[VAPI LLM] OpenAI response format:', JSON.stringify(openAIResponse, null, 2))

    return NextResponse.json(openAIResponse)
  } catch (error) {
    console.error('[VAPI LLM] Endpoint error:', error)
    return NextResponse.json(
      formatOpenAIErrorResponse(
        "I'm having trouble processing your request right now. Could you please try again?"
      ),
      { status: 500 }
    )
  }
}
