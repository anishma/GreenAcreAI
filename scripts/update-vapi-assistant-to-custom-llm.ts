import { prisma } from '@/lib/prisma'
import { updateAgent } from '@/lib/vapi/client'

/**
 * Update existing VAPI assistant to use custom LLM endpoint
 * Run this after deploying to Vercel
 */
async function updateAssistantToCustomLLM() {
  console.log('🔄 Updating VAPI Assistant to use Custom LLM...\n')

  // Get production URL
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://green-acre-ai.vercel.app'

  console.log('Production URL:', productionUrl)

  // Get tenant with VAPI agent
  const tenant = await prisma.tenants.findFirst({
    where: {
      vapi_agent_id: { not: null },
    },
  })

  if (!tenant || !tenant.vapi_agent_id) {
    console.log('❌ No tenant found with VAPI agent')
    console.log('Run tenant onboarding first')
    return
  }

  console.log('\n📋 Tenant Info:')
  console.log('- Tenant ID:', tenant.id)
  console.log('- Business:', tenant.business_name)
  console.log('- VAPI Agent ID:', tenant.vapi_agent_id)

  // Prepare update
  const customLLMEndpoint = `${productionUrl}/api/vapi-llm`

  console.log('\n🔧 Update Configuration:')
  console.log('- Custom LLM URL:', customLLMEndpoint)
  console.log('- Metadata: {"tenant_id": "' + tenant.id + '"}')

  // Update assistant
  try {
    console.log('\n⏳ Updating VAPI assistant...')

    const updatedAssistant = await updateAgent(tenant.vapi_agent_id, {
      model: {
        provider: 'custom-llm',
        url: customLLMEndpoint,
        metadata: {
          tenant_id: tenant.id,
        },
      } as any,
    })

    console.log('\n✅ Assistant updated successfully!')
    console.log('Updated assistant:', JSON.stringify(updatedAssistant, null, 2))
  } catch (error: any) {
    console.error('\n❌ Error updating assistant:', error.message)
    console.log('\nYou can update manually in VAPI Dashboard:')
    console.log('1. Go to: https://dashboard.vapi.ai/assistants')
    console.log('2. Find assistant ID:', tenant.vapi_agent_id)
    console.log('3. Edit → Model Configuration')
    console.log('4. Select: Custom LLM')
    console.log('5. URL:', customLLMEndpoint)
    console.log('6. Metadata: {"tenant_id": "' + tenant.id + '"}')
    throw error
  }

  console.log('\n📋 Next Steps:')
  console.log('1. ✅ Assistant updated to use custom LLM')
  console.log('2. Configure webhook in VAPI Dashboard:')
  console.log('   - Go to: https://dashboard.vapi.ai/settings')
  console.log('   - Webhooks tab')
  console.log('   - Add URL:', `${productionUrl}/api/webhooks/vapi`)
  console.log('   - Select events: call-start, end-of-call-report')
  console.log('3. Make a test call to:', tenant.phone_number || 'VAPI phone number')
}

updateAssistantToCustomLLM()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
