/**
 * Auth Layout
 *
 * Shared layout for authentication pages (login, signup).
 * Centers content with a clean, minimal design.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="w-full max-w-md px-6">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">GreenAcre AI</h1>
          <p className="text-muted-foreground mt-2">
            Voice AI for Lawn Care Businesses
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-card rounded-lg shadow-lg border p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 GreenAcre AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
