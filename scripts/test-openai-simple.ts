#!/usr/bin/env tsx
/**
 * Simplest possible OpenAI API test
 */

import 'dotenv/config'
import OpenAI from 'openai'

async function testSimple() {
  const apiKey = process.env.OPENAI_API_KEY

  console.log('🔑 API Key:', apiKey?.substring(0, 20) + '...')
  console.log('📝 Key type:', apiKey?.startsWith('sk-proj-') ? 'Project-scoped' : 'Standard')

  const openai = new OpenAI({ apiKey })

  // Try different models
  const modelsToTry = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ]

  for (const model of modelsToTry) {
    try {
      console.log(`\nTesting ${model}...`)
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      })
      console.log(`✅ ${model} WORKS!`)
      console.log(`   Response: ${response.choices[0].message.content}`)
      break // Success, exit loop
    } catch (error: any) {
      console.log(`❌ ${model} failed: ${error.status} - ${error.message?.substring(0, 80)}`)
    }
  }
}

testSimple()
