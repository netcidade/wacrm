import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

// Lazy, shared service-role client for automation engine work.
let _adminClient: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      ENV.NEXT_PUBLIC_SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY,
    )
  }
  return _adminClient
}
