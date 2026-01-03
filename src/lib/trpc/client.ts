/**
 * tRPC Client Configuration
 *
 * Client-side tRPC setup with React Query integration.
 * Use this in Client Components to make type-safe API calls.
 */

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from './routers/_app'

export const trpc = createTRPCReact<AppRouter>()
