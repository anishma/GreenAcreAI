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
 * @param areaCode - Optional area code preference (e.g., "415")
 * @returns Phone number details
 */
export async function purchasePhoneNumber(
  areaCode?: string
): Promise<VapiPhoneNumber> {
  const body: any = {
    provider: 'twilio', // VAPI uses Twilio as the provider
  }

  if (areaCode) {
    body.areaCode = areaCode
  }

  return vapiRequest<VapiPhoneNumber>('/phone-number', {
    method: 'POST',
    body: JSON.stringify(body),
  })
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
 * Create a VAPI agent
 *
 * @param config - Agent configuration
 * @returns Agent details
 */
export async function createAgent(config: {
  name: string
  tenantId: string
  customLlmUrl?: string
}): Promise<VapiAgent> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const llmEndpoint = config.customLlmUrl || `${appUrl}/api/llm/completions`

  const body = {
    name: config.name,
    voice: {
      provider: 'elevenlabs',
      voiceId: 'rachel', // Default voice, can be customized later
    },
    model: {
      provider: 'custom-llm',
      url: llmEndpoint,
      // Pass tenant ID in metadata so our LLM endpoint knows which tenant this is
      metadata: {
        tenantId: config.tenantId,
      },
    },
    firstMessage: 'Hello! Thank you for calling. How can I help you today?',
    endCallFunctionEnabled: true,
    // Enable recording for quality assurance
    recordingEnabled: true,
  }

  return vapiRequest<VapiAgent>('/agent', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Get an agent by ID
 */
export async function getAgent(agentId: string): Promise<VapiAgent> {
  return vapiRequest<VapiAgent>(`/agent/${agentId}`, {
    method: 'GET',
  })
}

/**
 * Update an agent
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<VapiAgent>
): Promise<VapiAgent> {
  return vapiRequest<VapiAgent>(`/agent/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await vapiRequest(`/agent/${agentId}`, {
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
  return vapiRequest<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      assistantId: agentId,
    }),
  })
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
