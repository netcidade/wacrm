import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

// Singleton instance — one client shared across the whole browser session.
let browserClient: SupabaseClient | undefined

export function createClient() {
  if (browserClient) return browserClient

  browserClient = createBrowserClient(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return browserClient
}
