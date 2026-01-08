#!/usr/bin/env tsx
/**
 * Test LangChain configuration with verbose logging
 */

import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import OpenAI from 'openai'

async function testConfig() {
  console.log('=== Testing OpenAI Configuration ===\n')

  const apiKey = process.env.OPENAI_API_KEY
  console.log('API Key:', apiKey?.substring(0, 20) + '...')
  console.log('API Key length:', apiKey?.length)

  // Test 1: Direct OpenAI SDK
  console.log('\n--- Test 1: Direct OpenAI SDK ---')
  try {
    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    })
    console.log('✅ Direct SDK works!')
    console.log('Response:', response.choices[0].message.content)
  } catch (error: any) {
    console.log('❌ Direct SDK failed:', error.status, error.message)
  }

  // Test 2: LangChain with explicit configuration
  console.log('\n--- Test 2: LangChain ChatOpenAI ---')
  try {
    const llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      maxTokens: 5,
      verbose: true,
    })

    const response = await llm.invoke('Hi')
    console.log('✅ LangChain works!')
    console.log('Response:', response.content)
  } catch (error: any) {
    console.log('❌ LangChain failed:', error.constructor.name)
    console.log('Status:', error.status)
    console.log('Message:', error.message)
    console.log('\nFull error object keys:', Object.keys(error))

    // Check if there's additional info
    if (error.response) {
      console.log('Response data:', error.response.data)
    }
    if (error.cause) {
      console.log('Cause:', error.cause)
    }
  }

  // Test 3: LangChain with configuration object
  console.log('\n--- Test 3: LangChain with explicit config ---')
  try {
    const llm = new ChatOpenAI({
      configuration: {
        apiKey: apiKey,
      },
      modelName: 'gpt-3.5-turbo',
      maxTokens: 5,
    })

    const response = await llm.invoke('Hi')
    console.log('✅ LangChain with config works!')
    console.log('Response:', response.content)
  } catch (error: any) {
    console.log('❌ LangChain with config failed:', error.status, error.message)
  }
}

testConfig()
