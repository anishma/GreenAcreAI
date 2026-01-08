#!/usr/bin/env tsx
/**
 * Simple test to verify OpenAI API key is working
 */

import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'

async function testOpenAIKey() {
  console.log('Testing OpenAI API Key...\n')

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment')
    process.exit(1)
  }

  console.log(`✓ API Key loaded: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`)
  console.log(`✓ Key length: ${apiKey.length} characters\n`)

  try {
    console.log('Attempting to call OpenAI API with gpt-4o-mini...')

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      maxTokens: 10,
    })

    const response = await llm.invoke('Say hello')

    console.log('\n✅ SUCCESS! OpenAI API is working')
    console.log('Response:', response.content)

  } catch (error: any) {
    console.error('\n❌ FAILED! OpenAI API returned an error\n')
    console.error('Error type:', error.constructor.name)
    console.error('Status code:', error.status)
    console.error('Message:', error.message || 'No message')

    if (error.status === 403) {
      console.error('\n🔍 Diagnosis: 403 Forbidden Error')
      console.error('This usually means one of the following:')
      console.error('  1. No payment method added to your OpenAI account')
      console.error('  2. Free tier credits exhausted')
      console.error('  3. Spending limit reached')
      console.error('  4. Billing issue (expired card, insufficient funds)')
      console.error('\n📝 Action Required:')
      console.error('  • Visit: https://platform.openai.com/account/billing')
      console.error('  • Check payment method and billing status')
      console.error('  • Add credits or payment method if needed')
      console.error('  • Check usage: https://platform.openai.com/usage')
    } else if (error.status === 401) {
      console.error('\n🔍 Diagnosis: 401 Unauthorized')
      console.error('The API key is invalid or expired')
    } else if (error.status === 429) {
      console.error('\n🔍 Diagnosis: 429 Rate Limit')
      console.error('Too many requests or quota exceeded')
    }

    process.exit(1)
  }
}

testOpenAIKey()
