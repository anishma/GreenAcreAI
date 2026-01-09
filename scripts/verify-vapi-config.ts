import { prisma } from '@/lib/prisma'

async function verifyConfig() {
  console.log('🔍 Verifying VAPI Configuration...\n')

  // 1. Check environment variables
  console.log('1. Environment Variables:')
  console.log('   VAPI_API_KEY:', process.env.VAPI_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('   VAPI_WEBHOOK_SECRET:', process.env.VAPI_WEBHOOK_SECRET ? '✅ Set' : '⚠️  Optional')
  console.log('   TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing')
  console.log('   TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing')
  console.log('   TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing')
  console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('   REGRID_API_KEY:', process.env.REGRID_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

  // 2. Check database
  console.log('\n2. Database Configuration:')
  const tenant = await prisma.tenants.findFirst()

  if (!tenant) {
    console.log('   ❌ No tenant found. Please create a tenant first.')
    console.log('   Run: npm run seed (if you have a seed script)')
    return
  }

  console.log('   ✅ Tenant found!')
  console.log('   - Tenant ID:', tenant.id)
  console.log('   - Business Name:', tenant.business_name)
  console.log('   - VAPI Phone Number ID:', tenant.vapi_phone_number_id || '❌ Not set (REQUIRED)')
  console.log('   - VAPI Agent ID:', tenant.vapi_agent_id || '⚠️  Not set (optional)')
  console.log('   - Owner Phone (for SMS):', tenant.phone_number || '❌ Not set (REQUIRED for SMS)')
  console.log('   - Email:', tenant.email)

  // 3. Check endpoints
  console.log('\n3. Endpoints Status:')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  console.log('   Base URL:', baseUrl)
  console.log('   LLM Endpoint:', `${baseUrl}/api/vapi-llm`)
  console.log('   Webhook Endpoint:', `${baseUrl}/api/webhooks/vapi`)

  // 4. Check if app is running locally
  console.log('\n4. Deployment Status:')
  if (process.env.VERCEL_URL) {
    console.log('   ✅ Running on Vercel')
  } else if (baseUrl.includes('ngrok')) {
    console.log('   ✅ Using ngrok tunnel')
  } else {
    console.log('   ⚠️  Running locally - you need ngrok or Vercel deployment for VAPI')
    console.log('   Run: ngrok http 3000')
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Configuration Check Complete!')
  console.log('='.repeat(60))

  const issues: string[] = []

  if (!process.env.VAPI_API_KEY) issues.push('Missing VAPI_API_KEY')
  if (!process.env.TWILIO_ACCOUNT_SID) issues.push('Missing TWILIO_ACCOUNT_SID')
  if (!process.env.OPENAI_API_KEY) issues.push('Missing OPENAI_API_KEY')
  if (!tenant) issues.push('No tenant in database')
  if (tenant && !tenant.vapi_phone_number_id) issues.push('Tenant missing vapi_phone_number_id')
  if (tenant && !tenant.phone_number) issues.push('Tenant missing phone_number')

  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:')
    issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log('\n🎉 All configuration looks good!')
  }

  console.log('\n📋 Next Steps:')
  console.log('   1. Deploy app to Vercel (vercel --prod) or start ngrok (ngrok http 3000)')
  console.log('   2. Go to VAPI Dashboard: https://dashboard.vapi.ai/')
  console.log('   3. Create Assistant with Custom LLM:')
  console.log(`      - URL: ${baseUrl}/api/vapi-llm`)
  console.log(`      - Metadata: {"tenant_id": "${tenant?.id || 'YOUR_TENANT_ID'}"}`)
  console.log('   4. Buy VAPI phone number and link to assistant')
  console.log('   5. Configure webhook URL in VAPI Settings:')
  console.log(`      - URL: ${baseUrl}/api/webhooks/vapi`)
  console.log('   6. Update database with VAPI phone number ID:')
  console.log(`      UPDATE tenants SET vapi_phone_number_id = 'YOUR_VAPI_PHONE_ID' WHERE id = '${tenant?.id || 'YOUR_TENANT_ID'}';`)
  console.log('   7. Make a test call!')
  console.log('\n📖 See Docs/VAPI_SETUP_GUIDE.md for detailed instructions')
}

verifyConfig()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
