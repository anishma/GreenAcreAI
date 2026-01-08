/**
 * VAPI Webhook Event Types
 * Based on VAPI API documentation
 */

export interface VapiWebhookEvent {
  type: string
  call?: VapiCall
  message?: VapiMessage
  timestamp?: string
}

export interface VapiCall {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall'
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  endedReason?:
    | 'assistant-error'
    | 'assistant-not-found'
    | 'db-error'
    | 'no-server-available'
    | 'pipeline-error-openai-llm-failed'
    | 'pipeline-error-azure-openai-llm-failed'
    | 'pipeline-error-groq-llm-failed'
    | 'pipeline-error-anthropic-llm-failed'
    | 'pipeline-error-vapi-llm-failed'
    | 'pipeline-error-vapi-400-bad-request-validation-failed'
    | 'pipeline-error-vapi-401-unauthorized'
    | 'pipeline-error-vapi-403-forbidden'
    | 'pipeline-error-vapi-404-not-found'
    | 'pipeline-error-vapi-429-exceeded-quota'
    | 'pipeline-error-vapi-500-server-error'
    | 'assistant-ended-call'
    | 'assistant-forwarded-call'
    | 'assistant-join-timed-out'
    | 'customer-busy'
    | 'customer-ended-call'
    | 'customer-did-not-answer'
    | 'customer-did-not-give-microphone-permission'
    | 'assistant-said-end-call-phrase'
    | 'unknown-error'
    | 'voicemail'
    | 'vonage-disconnected'
    | 'vonage-failed-to-connect-call'
    | 'phone-call-provider-bypass-enabled-but-no-call-received'
  phoneNumber?: {
    id: string
    number: string
  }
  customer?: {
    number?: string
  }
  assistantId?: string
  transcript?: string
  recordingUrl?: string
  summary?: string
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: {
    transport?: number
    stt?: number
    llm?: number
    tts?: number
    vapi?: number
    total?: number
  }
  messages?: VapiMessage[]
  phoneCallProvider?: string
  phoneCallProviderId?: string
  phoneCallTransport?: string
}

export interface VapiMessage {
  role: 'assistant' | 'user' | 'system' | 'tool' | 'function'
  message?: string
  time?: number
  endTime?: number
  secondsFromStart?: number
  duration?: number
  toolCalls?: any[]
}

export interface CallStartedEvent extends VapiWebhookEvent {
  type: 'call-start'
  call: VapiCall
}

export interface CallEndedEvent extends VapiWebhookEvent {
  type: 'end-of-call-report'
  call: VapiCall
}

export interface TranscriptUpdateEvent extends VapiWebhookEvent {
  type: 'transcript'
  message: VapiMessage
}

export interface StatusUpdateEvent extends VapiWebhookEvent {
  type: 'status-update'
  status: VapiCall['status']
}

export interface FunctionCallEvent extends VapiWebhookEvent {
  type: 'function-call'
  functionCall: {
    name: string
    parameters: Record<string, any>
  }
}
