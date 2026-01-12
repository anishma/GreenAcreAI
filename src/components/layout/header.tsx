/**
 * Dashboard Header
 *
 * Top navigation bar with user menu and actions.
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAppState } from '@/store/app-state'
import { Bell, Settings, User, Menu } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { sidebarOpen, toggleSidebar } = useAppState()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      {/* Left Side - Hamburger (when sidebar collapsed) + Page Title */}
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <User className="h-5 w-5" />
        </Button>

        {/* Sign Out (temporary) */}
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </header>
  )
}
