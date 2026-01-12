/**
 * Settings Index Page
 * Redirects to the first settings tab (Business)
 */

import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/settings/business')
}
