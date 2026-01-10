/**
 * Global App State (Zustand)
 *
 * Central state management for app-wide UI state and current tenant context.
 * This store is client-side only and should be used in 'use client' components.
 */

import { create } from 'zustand'
import type { tenants } from '@prisma/client'

interface AppState {
  // Sidebar visibility state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Current tenant context (for multi-tenant switching)
  currentTenant: tenants | null
  setCurrentTenant: (tenant: tenants | null) => void

  // User profile data (cached from DB)
  userProfile: {
    id: string
    email: string
    fullName: string | null
    role: string
    tenantId: string
  } | null
  setUserProfile: (profile: AppState['userProfile']) => void
  clearUserProfile: () => void
}

export const useAppState = create<AppState>((set) => ({
  // Sidebar state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Tenant state
  currentTenant: null,
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

  // User profile state
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  clearUserProfile: () => set({ userProfile: null, currentTenant: null }),
}))
