import { ConversationState } from '../state'
import { prisma } from '@/lib/prisma'

export async function closingNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const tenant = await prisma.tenants.findUnique({
    where: { id: state.tenant_id },
    select: { business_name: true, phone: true },
  })

  // Check if booking was successful
  if (state.booking) {
    return {
      messages: [{
          role: 'assistant',
          content: `Thank you for choosing ${tenant?.business_name}! We look forward to serving you. If you need to reschedule or have any questions, please call us at ${tenant?.phone}. Have a great day!`,
        },
      ],
      stage: 'END',
    }
  }

  // Check if quote was provided
  if (state.quote) {
    return {
      messages: [{
          role: 'assistant',
          content: `Thanks for your interest in ${tenant?.business_name}! Feel free to call us back at ${tenant?.phone} when you're ready to schedule. Have a great day!`,
        },
      ],
      stage: 'END',
    }
  }

  // Generic closing
  return {
    messages: [{
        role: 'assistant',
        content: `Thank you for calling ${tenant?.business_name}! If you have any questions, please don't hesitate to call us at ${tenant?.phone}. Have a great day!`,
      },
    ],
    stage: 'END',
  }
}
