/**
 * VAPI Client
 *
 * Client library for interacting with VAPI (Voice AI Platform Interface).
 * Handles phone number provisioning, agent creation, and call management.
 */

const VAPI_API_URL = 'https://api.vapi.ai'

/**
 * Get VAPI API key from environment
 */
function getVapiApiKey(): string {
  const apiKey = process.env.VAPI_API_KEY

  if (!apiKey) {
    throw new Error('VAPI_API_KEY environment variable is not set')
  }

  return apiKey
}

/**
 * Make a request to VAPI API
 */
async function vapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getVapiApiKey()

  const response = await fetch(`${VAPI_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `VAPI API error: ${response.status} - ${errorData.message || response.statusText}`
    )
  }

  return response.json()
}

/**
 * Phone number interface
 */
export interface VapiPhoneNumber {
  id: string
  number: string
  provider: string
  createdAt: string
  updatedAt: string
}

/**
 * Agent interface
 */
export interface VapiAgent {
  id: string
  name: string
  voice: {
    provider: string
    voiceId: string
  }
  model: {
    provider: string
    model: string
    url?: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Purchase a phone number from VAPI
 *
 * Uses VAPI's free phone number service (US numbers only).
 * Up to 10 free numbers can be provisioned per account.
 *
 * @param areaCode - Optional area code preference (e.g., "415")
 * @returns Phone number details
 */
export async function purchasePhoneNumber(
  areaCode: string
): Promise<VapiPhoneNumber> {
  // Use VAPI's free phone number service
  // This creates a US phone number at no cost
  // Note: Area code is required for VAPI to provision a valid phone number
  const body: any = {
    provider: 'vapi',
    name: 'AI Assistant Number',
    numberDesiredAreaCode: areaCode,
  }

  const response = await vapiRequest<VapiPhoneNumber>('/phone-number', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  console.log('[VAPI] Phone number creation response:', JSON.stringify(response, null, 2))

  // VAPI doesn't return the 'number' field immediately when using provider: 'vapi'
  // We need to fetch the phone number details to get the actual number
  if (!response.number && response.id) {
    console.log('[VAPI] Number field missing, fetching phone number details...')
    const detailedResponse = await getPhoneNumber(response.id)
    console.log('[VAPI] Phone number details response:', JSON.stringify(detailedResponse, null, 2))
    return detailedResponse
  }

  return response
}

/**
 * Get a phone number by ID
 */
export async function getPhoneNumber(phoneNumberId: string): Promise<VapiPhoneNumber> {
  return vapiRequest<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, {
    method: 'GET',
  })
}

/**
 * Delete a phone number
 */
export async function deletePhoneNumber(phoneNumberId: string): Promise<void> {
  await vapiRequest(`/phone-number/${phoneNumberId}`, {
    method: 'DELETE',
  })
}

/**
 * Create a VAPI assistant (formerly called agent)
 *
 * @param config - Assistant configuration
 * @returns Assistant details
 */
export async function createAgent(config: {
  name: string
  tenantId: string
  customLlmUrl?: string
}): Promise<VapiAgent> {
  // const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  // Include tenant ID in URL as query parameter (for future use)
  // const llmEndpoint = config.customLlmUrl || `${appUrl}/api/llm/completions?tenantId=${config.tenantId}`

  const body = {
    name: config.name,
    // Transcriber configuration (required)
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    // Voice configuration - using ElevenLabs (works with VAPI's free tier)
    voice: {
      provider: '11labs',
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - default female voice
      stability: 0.5,
      similarityBoost: 0.75,
    },
    // Model configuration - using OpenAI for now
    // TODO: Switch to custom-llm once we implement the LLM endpoint
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for a lawn care business.
Help customers with:
- Getting quotes for services
- Scheduling appointments
- Answering questions about services
- Providing property information

Be friendly, professional, and concise.`
        }
      ],
    },
    firstMessage: 'Hello! Thank you for calling. How can I help you today?',
    endCallFunctionEnabled: true,
    // Enable recording for quality assurance
    recordingEnabled: true,
  }

  const response = await vapiRequest<VapiAgent>('/assistant', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  console.log('[VAPI] Agent creation response:', JSON.stringify(response, null, 2))

  return response
}

/**
 * Get an assistant by ID
 */
export async function getAgent(agentId: string): Promise<VapiAgent> {
  return vapiRequest<VapiAgent>(`/assistant/${agentId}`, {
    method: 'GET',
  })
}

/**
 * Update an assistant
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<VapiAgent>
): Promise<VapiAgent> {
  return vapiRequest<VapiAgent>(`/assistant/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

/**
 * Delete an assistant
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await vapiRequest(`/assistant/${agentId}`, {
    method: 'DELETE',
  })
}

/**
 * Link a phone number to an agent
 *
 * @param phoneNumberId - VAPI phone number ID
 * @param agentId - VAPI agent ID
 */
export async function linkPhoneNumberToAgent(
  phoneNumberId: string,
  agentId: string
): Promise<VapiPhoneNumber> {
  console.log('[VAPI] Linking phone number to agent:', { phoneNumberId, agentId })

  const response = await vapiRequest<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      assistantId: agentId,
    }),
  })

  console.log('[VAPI] Link response:', JSON.stringify(response, null, 2))

  return response
}

/**
 * Get call details by ID
 */
export async function getCall(callId: string) {
  return vapiRequest(`/call/${callId}`, {
    method: 'GET',
  })
}

/**
 * List all calls for an assistant
 */
export async function listCalls(assistantId?: string) {
  const params = assistantId ? `?assistantId=${assistantId}` : ''
  return vapiRequest(`/call${params}`, {
    method: 'GET',
  })
}
