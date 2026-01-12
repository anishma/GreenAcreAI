import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  console.log('Checking Mike tenant data...\n')

  const user = await prisma.users.findUnique({
    where: { email: 'mike.lawncare123@gmail.com' },
    select: { tenant_id: true }
  })

  if (!user || !user.tenant_id) {
    console.log('No tenant found for Mike')
    await prisma.$disconnect()
    return
  }

  console.log('Mike tenant_id:', user.tenant_id, '\n')

  const [calls, bookings, leads] = await Promise.all([
    prisma.calls.findMany({
      where: { tenant_id: user.tenant_id },
      select: {
        id: true,
        caller_phone_number: true,
        created_at: true,
        outcome: true,
        tenant_id: true
      },
      orderBy: { created_at: 'desc' },
      take: 5
    }),
    prisma.bookings.findMany({
      where: { tenant_id: user.tenant_id },
      select: {
        id: true,
        customer_name: true,
        scheduled_at: true,
        tenant_id: true
      },
      orderBy: { scheduled_at: 'desc' },
      take: 5
    }),
    prisma.leads.count({
      where: { tenant_id: user.tenant_id }
    })
  ])

  console.log('CALLS:', calls.length)
  if (calls.length > 0) {
    calls.forEach(call => {
      console.log('  -', call.caller_phone_number, '|', call.outcome, '|', call.created_at)
    })
  }

  console.log('\nBOOKINGS:', bookings.length)
  if (bookings.length > 0) {
    bookings.forEach(booking => {
      console.log('  -', booking.customer_name, '|', booking.scheduled_at)
    })
  }

  console.log('\nLEADS:', leads)

  await prisma.$disconnect()
}

checkData().catch(console.error)
