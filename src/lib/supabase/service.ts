import { createClient } from '@supabase/supabase-js'

// Service role client for server-side operations without user auth (e.g. cron jobs)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
