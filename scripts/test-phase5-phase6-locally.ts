/**
 * Local Testing Script for Phase 5 & Phase 6
 *
 * Tests all Phase 5 and Phase 6 features that can be tested locally:
 * - VAPI endpoints accessibility
 * - Dashboard API endpoints
 * - Analytics endpoints
 * - tRPC procedures
 *
 * Run: npx tsx scripts/test-phase5-phase6-locally.ts
 */

import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testEndpoint(name: string, url: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const contentType = response.headers.get('content-type')
    let data

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (response.ok || response.status === 405) {
      console.log(`✅ ${name}: ${response.status} ${response.statusText}`)
      return { success: true, status: response.status, data }
    } else {
      console.log(`❌ ${name}: ${response.status} ${response.statusText}`)
      console.log('   Response:', JSON.stringify(data).substring(0, 200))
      return { success: false, status: response.status, data }
    }
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Testing Phase 5 & Phase 6 - Local Endpoints\n')
  console.log('Base URL:', BASE_URL)
  console.log('─'.repeat(60))

  // Get tenant for testing
  console.log('\n📋 Getting tenant for testing...')
  const tenant = await prisma.tenants.findFirst()

  if (!tenant) {
    console.log('❌ No tenant found. Please complete onboarding first.')
    return
  }

  console.log(`✅ Found tenant: ${tenant.business_name}`)
  console.log(`   Tenant ID: ${tenant.id}`)

  // Phase 5 Tests
  console.log('\n' + '='.repeat(60))
  console.log('PHASE 5: VAPI Integration Endpoints')
  console.log('='.repeat(60))

  console.log('\n1️⃣ Testing VAPI LLM Endpoint')
  await testEndpoint(
    'VAPI LLM endpoint exists',
    `${BASE_URL}/api/vapi-llm`,
    'POST',
    {
      message: { role: 'user', content: 'Hi' },
      call: { id: 'test-call-123', customer: { number: '+15551234567' } },
      model: { metadata: { tenant_id: tenant.id } }
    }
  )

  console.log('\n2️⃣ Testing VAPI Webhook Endpoint')
  await testEndpoint(
    'VAPI webhook endpoint exists',
    `${BASE_URL}/api/webhooks/vapi`,
    'POST',
    {
      type: 'call-start',
      call: { id: 'test-123', phoneNumberId: tenant.vapi_phone_number_id }
    }
  )

  // Phase 6 Tests
  console.log('\n' + '='.repeat(60))
  console.log('PHASE 6: Dashboard & Analytics Endpoints')
  console.log('='.repeat(60))

  console.log('\n3️⃣ Testing Dashboard Page')
  const dashboardResult = await testEndpoint(
    'Dashboard page loads',
    `${BASE_URL}/dashboard`,
    'GET'
  )

  if (dashboardResult.success) {
    const html = dashboardResult.data
    if (typeof html === 'string' && html.includes('<!DOCTYPE html>')) {
      console.log('   ✓ HTML page returned')
    }
  }

  console.log('\n4️⃣ Testing Calls Page')
  await testEndpoint(
    'Calls page loads',
    `${BASE_URL}/calls`,
    'GET'
  )

  console.log('\n5️⃣ Testing Leads Page')
  await testEndpoint(
    'Leads page loads',
    `${BASE_URL}/leads`,
    'GET'
  )

  console.log('\n6️⃣ Testing Bookings Page')
  await testEndpoint(
    'Bookings page loads',
    `${BASE_URL}/bookings`,
    'GET'
  )

  console.log('\n7️⃣ Testing Analytics Page')
  await testEndpoint(
    'Analytics page loads',
    `${BASE_URL}/analytics`,
    'GET'
  )

  console.log('\n8️⃣ Testing Settings Page')
  await testEndpoint(
    'Settings page loads',
    `${BASE_URL}/settings/business`,
    'GET'
  )

  // tRPC Tests (direct database queries instead of API calls)
  console.log('\n' + '='.repeat(60))
  console.log('DATABASE: Testing Data Access')
  console.log('='.repeat(60))

  console.log('\n9️⃣ Testing Calls Data')
  try {
    const callsCount = await prisma.calls.count({
      where: { tenant_id: tenant.id }
    })
    console.log(`✅ Found ${callsCount} calls for tenant`)
  } catch (error: any) {
    console.log(`❌ Error fetching calls: ${error.message}`)
  }

  console.log('\n🔟 Testing Leads Data')
  try {
    const leadsCount = await prisma.leads.count({
      where: { tenant_id: tenant.id }
    })
    console.log(`✅ Found ${leadsCount} leads for tenant`)
  } catch (error: any) {
    console.log(`❌ Error fetching leads: ${error.message}`)
  }

  console.log('\n1️⃣1️⃣ Testing Bookings Data')
  try {
    const bookingsCount = await prisma.bookings.count({
      where: { tenant_id: tenant.id }
    })
    console.log(`✅ Found ${bookingsCount} bookings for tenant`)
  } catch (error: any) {
    console.log(`❌ Error fetching bookings: ${error.message}`)
  }

  console.log('\n1️⃣2️⃣ Testing Analytics Data')
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const callsToday = await prisma.calls.count({
      where: {
        tenant_id: tenant.id,
        created_at: { gte: today }
      }
    })
    console.log(`✅ Found ${callsToday} calls today`)
  } catch (error: any) {
    console.log(`❌ Error fetching analytics: ${error.message}`)
  }

  // Configuration Check
  console.log('\n' + '='.repeat(60))
  console.log('CONFIGURATION: Environment & Database')
  console.log('='.repeat(60))

  console.log('\n1️⃣3️⃣ Checking Environment Variables')
  const requiredEnvVars = [
    'VAPI_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'OPENAI_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`)
    } else {
      console.log(`   ❌ ${varName}: Missing`)
    }
  })

  console.log('\n1️⃣4️⃣ Checking Tenant Configuration')
  console.log(`   VAPI Phone Number ID: ${tenant.vapi_phone_number_id || '❌ Not set'}`)
  console.log(`   VAPI Agent ID: ${tenant.vapi_agent_id || '❌ Not set'}`)
  console.log(`   Owner Phone: ${tenant.phone_number || '❌ Not set'}`)
  console.log(`   Google Calendar: ${tenant.google_calendar_refresh_token ? '✅ Connected' : '❌ Not connected'}`)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log('\n✅ Local testing complete!')
  console.log('\n📋 Next Steps:')
  console.log('1. If all tests pass, commit your changes')
  console.log('2. Push to GitHub to trigger Vercel deployment')
  console.log('3. After deployment, update VAPI assistant configuration')
  console.log('4. Configure VAPI webhook URL')
  console.log('5. Make a test call!')
  console.log('\n📖 See Docs/VAPI_SETUP_GUIDE.md for deployment instructions')
}

runTests()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
