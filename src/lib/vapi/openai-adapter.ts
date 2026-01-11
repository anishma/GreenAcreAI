/**
 * OpenAI API Adapter for VAPI Custom LLM Integration
 *
 * VAPI expects OpenAI-compatible request/response formats.
 * This adapter translates between VAPI/OpenAI format and our LangGraph agent.
 */

/**
 * OpenAI Chat Completion Request (from VAPI)
 */
export interface OpenAIChatCompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
}

/**
 * OpenAI Chat Completion Response (to VAPI)
 * Non-streaming format
 */
export interface OpenAIChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: 'stop' | 'length' | 'content_filter' | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * OpenAI Streaming Response Chunk (SSE format)
 */
export interface OpenAIChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: 'assistant'
      content?: string
    }
    finish_reason: 'stop' | 'length' | 'content_filter' | null
  }>
}

/**
 * Extract the last user message from OpenAI messages array
 */
export function extractUserMessage(messages: OpenAIChatCompletionRequest['messages']): string {
  const userMessages = messages.filter(m => m.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]
  return lastUserMessage?.content || ''
}

/**
 * Convert assistant response to OpenAI format (non-streaming)
 */
export function formatOpenAIResponse(
  assistantMessage: string,
  requestId?: string
): OpenAIChatCompletionResponse {
  return {
    id: requestId || `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'custom-langgraph',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: assistantMessage,
        },
        finish_reason: 'stop',
      },
    ],
  }
}

/**
 * Format error response in OpenAI format
 */
export function formatOpenAIErrorResponse(
  errorMessage: string,
  requestId?: string
): OpenAIChatCompletionResponse {
  return {
    id: requestId || `chatcmpl-error-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'custom-langgraph',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: errorMessage,
        },
        finish_reason: 'stop',
      },
    ],
  }
}

/**
 * Create SSE chunk in OpenAI streaming format
 * Used if we implement streaming in the future
 */
export function createStreamingChunk(
  content: string,
  isFirst: boolean,
  isLast: boolean,
  requestId?: string
): string {
  const chunk: OpenAIChatCompletionChunk = {
    id: requestId || `chatcmpl-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'custom-langgraph',
    choices: [
      {
        index: 0,
        delta: isFirst
          ? { role: 'assistant', content }
          : { content },
        finish_reason: isLast ? 'stop' : null,
      },
    ],
  }

  return `data: ${JSON.stringify(chunk)}\n\n`
}

/**
 * Create the final SSE [DONE] message
 */
export function createStreamingDone(): string {
  return 'data: [DONE]\n\n'
}
