'use client'

import { trpc } from '@/lib/trpc/client'

export default function TestTRPCPage() {
  // Test public endpoint
  const helloQuery = trpc.user.hello.useQuery()

  // Test protected endpoint (will fail if not authenticated)
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    retry: false,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">tRPC Test Page</h1>

        {/* Public Endpoint Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Public Endpoint: user.hello
          </h2>
          {helloQuery.isLoading && (
            <p className="text-gray-600">Loading...</p>
          )}
          {helloQuery.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-700">{helloQuery.error.message}</p>
            </div>
          )}
          {helloQuery.data && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-semibold">Success!</p>
              <pre className="mt-2 text-sm text-green-700">
                {JSON.stringify(helloQuery.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Protected Endpoint Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Protected Endpoint: user.getProfile
          </h2>
          {profileQuery.isLoading && (
            <p className="text-gray-600">Loading...</p>
          )}
          {profileQuery.error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-800 font-semibold">
                Expected Error (not authenticated):
              </p>
              <p className="text-yellow-700">{profileQuery.error.message}</p>
            </div>
          )}
          {profileQuery.data && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-semibold">Success!</p>
              <pre className="mt-2 text-sm text-green-700">
                {JSON.stringify(profileQuery.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> The protected endpoint will show an error if
            you're not logged in. The public endpoint should work regardless of
            authentication status.
          </p>
        </div>
      </div>
    </div>
  )
}
