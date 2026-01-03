/**
 * Dashboard Sidebar
 *
 * Side navigation with links to different sections of the app.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppState } from '@/store/app-state'
import {
  Home,
  Phone,
  Users,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useAppState()

  return (
    <aside
      className={cn(
        'border-r bg-card flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="h-16 border-b flex items-center px-6 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-lg whitespace-nowrap">
              GreenAcre AI
            </span>
          )}
        </Link>
        {sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen && 'justify-center'
              )}
              title={!sidebarOpen ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            © 2026 GreenAcre AI
          </div>
        </div>
      )}
    </aside>
  )
}
