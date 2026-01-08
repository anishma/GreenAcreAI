#!/usr/bin/env tsx
/**
 * Test what models are available with the current API key
 */

import 'dotenv/config'
import OpenAI from 'openai'

async function testModels() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found')
    process.exit(1)
  }

  console.log('Testing OpenAI API access...\n')
  console.log(`API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`)

  const openai = new OpenAI({ apiKey })

  try {
    console.log('\n1. Listing available models...')
    const models = await openai.models.list()

    const gptModels = models.data
      .filter(m => m.id.includes('gpt'))
      .map(m => m.id)
      .sort()

    console.log('\n✅ Available GPT models:')
    gptModels.forEach(model => console.log(`  - ${model}`))

    // Try a simple completion
    console.log('\n2. Testing chat completion with gpt-4o-mini...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "test successful"' }],
      max_tokens: 10,
    })

    console.log('\n✅ Chat completion successful!')
    console.log('Response:', response.choices[0].message.content)

  } catch (error: any) {
    console.error('\n❌ Error:', error.status, error.message)
    console.error('\nFull error:', JSON.stringify(error, null, 2))

    if (error.status === 403) {
      console.error('\n🔍 403 Forbidden - Checking possible causes:')
      console.error('  • Project API keys (sk-proj-*) may have restricted access')
      console.error('  • Try creating a standard API key (not project-scoped)')
      console.error('  • Check project settings: https://platform.openai.com/settings')
    }
  }
}

testModels()
