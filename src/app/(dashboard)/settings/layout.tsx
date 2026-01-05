'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  DollarSign,
  Calendar,
  Phone,
  Bell
} from 'lucide-react'

const tabs = [
  {
    name: 'Business',
    href: '/settings/business',
    icon: Building2,
  },
  {
    name: 'Pricing',
    href: '/settings/pricing',
    icon: DollarSign,
  },
  {
    name: 'Calendar',
    href: '/settings/calendar',
    icon: Calendar,
  },
  {
    name: 'Phone',
    href: '/settings/phone',
    icon: Phone,
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your business settings and preferences
        </p>
      </div>

      <div className="border-b">
        <nav className="flex space-x-8" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="py-6">{children}</div>
    </div>
  )
}
