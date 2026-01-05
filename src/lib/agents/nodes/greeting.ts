import { ConversationState } from '../state'
import { prisma } from '@/lib/prisma'

export async function greetingNode(state: ConversationState): Promise<Partial<ConversationState>> {
  const tenant = await prisma.tenants.findUnique({
    where: { id: state.tenant_id },
    select: { business_name: true },
  })

  return {
    messages: [
      ...state.messages,
      {
        role: 'assistant',
        content: `Thanks for calling ${tenant?.business_name}! I can help you get a quote for lawn mowing service. What's your address?`,
      },
    ],
    stage: 'address_collection',
  }
}
