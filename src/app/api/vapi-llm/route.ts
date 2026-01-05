import { NextRequest, NextResponse } from 'next/server'
import { conversationGraph } from '@/lib/agents/conversation-graph'
import { ConversationState } from '@/lib/agents/state'
import { prisma } from '@/lib/prisma'

// VAPI Custom LLM Endpoint
// Receives messages from VAPI and returns AI responses using our LangGraph agent

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // VAPI sends messages in this format:
    // {
    //   "message": {
    //     "role": "user",
    //     "content": "123 Main St, Springfield IL 62701"
    //   },
    //   "call": {
    //     "id": "call_123",
    //     "customer": {
    //       "number": "+15551234567"
    //     }
    //   },
    //   "model": {
    //     "metadata": {
    //       "tenant_id": "tenant_123"
    //     }
    //   }
    // }

    const userMessage = body.message
    const call = body.call
    const metadata = body.model?.metadata || {}

    if (!userMessage || !call) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const tenantId = metadata.tenant_id
    const callId = call.id
    const customerPhone = call.customer?.number

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant_id in metadata' },
        { status: 400 }
      )
    }

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
        content: userMessage.content,
      })
    } else {
      // Create new conversation
      state = {
        messages: [
          {
            role: 'user',
            content: userMessage.content,
          },
        ],
        tenant_id: tenantId,
        call_id: callId,
        customer_phone: customerPhone,
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
      return NextResponse.json(
        { error: 'No response generated' },
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

    // Return response in VAPI format
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: lastAssistantMessage.content,
      },
    })
  } catch (error) {
    console.error('VAPI LLM endpoint error:', error)
    return NextResponse.json(
      {
        message: {
          role: 'assistant',
          content:
            "I'm having trouble processing your request right now. Could you please try again?",
        },
      },
      { status: 500 }
    )
  }
}
