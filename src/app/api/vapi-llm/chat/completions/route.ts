import { NextRequest, NextResponse } from 'next/server'
import { conversationGraph } from '@/lib/agents/conversation-graph'
import { ConversationState } from '@/lib/agents/state'
import { prisma } from '@/lib/prisma'
import {
  OpenAIChatCompletionRequest,
  extractUserMessage,
  formatOpenAIResponse,
  formatOpenAIErrorResponse,
  createStreamingChunk,
  createStreamingDone,
} from '@/lib/vapi/openai-adapter'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

// VAPI Custom LLM Endpoint (OpenAI-Compatible)
// Receives OpenAI-formatted chat completion requests from VAPI
// Returns OpenAI-formatted responses using our LangGraph agent

export async function POST(req: NextRequest) {
  try {
    // Force Prisma to connect (helps with serverless cold starts)
    await prisma.$connect()

    const body: OpenAIChatCompletionRequest = await req.json()

    // ========== DEBUG LOGGING: RAW VAPI REQUEST ==========
    console.log('[VAPI LLM] ===== RAW REQUEST START =====')
    console.log('[VAPI LLM] Request ID:', req.headers.get('x-request-id') || 'none')
    console.log('[VAPI LLM] Timestamp:', new Date().toISOString())
    console.log('[VAPI LLM] Full body.messages:', JSON.stringify(body.messages, null, 2))
    console.log('[VAPI LLM] Body keys:', Object.keys(body))
    console.log('[VAPI LLM] ===== RAW REQUEST END =====')
    // ====================================================

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

    // Extract custom VAPI metadata from multiple sources
    // Priority: 1. Request body (body.call), 2. Headers, 3. System message
    const vapiCallId = req.headers.get('x-vapi-call-id')
    const vapiCustomerId = req.headers.get('x-vapi-customer-number')

    // VAPI may send call metadata in the request body
    const bodyCallId = (body as any).call?.id
    const bodyCustomerNumber = (body as any).call?.customer?.number

    // Fallback: Check if metadata is in the messages (system message)
    const systemMessage = body.messages.find(m => m.role === 'system')
    let tenantId: string | null = null
    let callId: string | null = bodyCallId || vapiCallId
    let customerPhone: string | null = bodyCustomerNumber || vapiCustomerId

    // Try to extract from system message if present
    if (systemMessage?.content) {
      const tenantMatch = systemMessage.content.match(/tenant_id:\s*(\S+)/)
      const callMatch = systemMessage.content.match(/call_id:\s*(\S+)/)
      const phoneMatch = systemMessage.content.match(/customer_phone:\s*(\S+)/)

      if (tenantMatch) tenantId = tenantMatch[1]

      // Only use system message call_id if it's not a template variable
      if (callMatch && !callMatch[1].includes('{{')) {
        callId = callId || callMatch[1]
      }

      // Only use system message phone if it's not a template variable
      if (phoneMatch && !phoneMatch[1].includes('{{')) {
        customerPhone = customerPhone || phoneMatch[1]
      }
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

    // ========== DEBUG LOGGING: EXTRACTED USER MESSAGE ==========
    console.log('[VAPI LLM] Extracted user message:', userMessageContent)
    console.log('[VAPI LLM] User message length:', userMessageContent?.length || 0)
    console.log('[VAPI LLM] User message bytes:', Buffer.from(userMessageContent || '').length)
    // ===========================================================

    if (!userMessageContent) {
      return NextResponse.json(
        formatOpenAIErrorResponse('No message provided'),
        { status: 400 }
      )
    }

    // Extract full system message from VAPI (personality + business rules)
    const systemPrompt = systemMessage?.content ||
      'You are a helpful AI assistant for a lawn care business. Be friendly, professional, and concise.'

    // Load or create conversation state from database
    let conversationRecord = await prisma.conversations.findUnique({
      where: { call_id: callId },
    })

    // ========== DEBUG LOGGING: CONVERSATION STATE ==========
    console.log('[VAPI LLM] Call ID:', callId)
    console.log('[VAPI LLM] Conversation exists in DB:', !!conversationRecord)
    if (conversationRecord) {
      console.log('[VAPI LLM] Previous message count:', (conversationRecord.conversation_history as any[])?.length || 0)
      console.log('[VAPI LLM] Current stage:', conversationRecord.current_stage)
      console.log('[VAPI LLM] Has booking:', !!conversationRecord.booking_data)
    }
    // =======================================================

    let state: ConversationState

    if (conversationRecord) {
      // Restore existing conversation
      // CRITICAL: Ensure messages array is always valid (not null/undefined)
      const existingMessages = Array.isArray(conversationRecord.conversation_history)
        ? conversationRecord.conversation_history as any[]
        : []

      state = {
        messages: existingMessages,
        system_context: systemPrompt, // Preserve full system prompt across turns
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

      console.log('[VAPI LLM] Restored conversation state:')
      console.log('  - Message count:', state.messages.length)
      console.log('  - Current stage:', state.stage)
      console.log('  - Customer name:', state.customer_name || 'not set')
    } else {
      // Create new conversation
      // IMPORTANT: Include ALL non-system messages from VAPI (including their firstMessage if present)
      const initialMessages = body.messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      // Check if VAPI already sent an assistant message (firstMessage)
      const hasAssistantMessage = initialMessages.some(m => m.role === 'assistant')

      state = {
        messages: initialMessages,
        system_context: systemPrompt, // Store system prompt for nodes to use
        tenant_id: tenantId,
        call_id: callId,
        customer_phone: customerPhone || undefined,
        // If VAPI already greeted, skip greeting node and go to intent routing
        stage: hasAssistantMessage ? 'intent_routing' : 'greeting',
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

    // Validate state before invoking graph
    if (!Array.isArray(state.messages) || state.messages.length === 0) {
      throw new Error('Invalid state: messages must be a non-empty array')
    }

    // Run the conversation graph with error handling
    let result: ConversationState
    try {
      result = await conversationGraph.invoke(state, {
        recursionLimit: 25,
      })
    } catch (graphError: any) {
      console.error('[VAPI LLM] Graph error:', graphError?.message || 'Unknown error')
      throw new Error(`Graph execution failed: ${graphError?.message || 'Unknown error'}`)
    }

    if (!result.messages || !Array.isArray(result.messages)) {
      return NextResponse.json(
        formatOpenAIErrorResponse('Invalid response from conversation graph'),
        { status: 500 }
      )
    }

    // Get the last assistant message
    const assistantMessages = result.messages.filter((m: any) => m.role === 'assistant')
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]

    if (!lastAssistantMessage) {
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

    // Log final response for monitoring
    console.log('[VAPI LLM] Response:', lastAssistantMessage.content)

    // Check if streaming is requested (VAPI requires streaming)
    const isStreaming = body.stream === true

    if (isStreaming) {
      // Return streaming response (SSE format required by VAPI)
      const encoder = new TextEncoder()
      const requestId = `chatcmpl-${callId}`

      const stream = new ReadableStream({
        start(controller) {
          try {
            // Send first chunk with role
            const firstChunk = createStreamingChunk(
              lastAssistantMessage.content,
              true,
              false,
              requestId
            )
            controller.enqueue(encoder.encode(firstChunk))

            // Send final chunk with finish_reason
            const finalChunk = createStreamingChunk(
              '',
              false,
              true,
              requestId
            )
            controller.enqueue(encoder.encode(finalChunk))

            // Send [DONE] message
            const done = createStreamingDone()
            controller.enqueue(encoder.encode(done))

            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Non-streaming fallback (for testing)
      const openAIResponse = formatOpenAIResponse(
        lastAssistantMessage.content,
        `chatcmpl-${callId}`
      )
      return NextResponse.json(openAIResponse)
    }
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
