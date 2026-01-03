/**
 * Dashboard Layout
 *
 * Shared layout for all dashboard pages with sidebar and header.
 */

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-secondary/20 p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
