import { createBrowserClient } from '@supabase/ssr'

/** Browser-side Supabase client. Cookie-based session handled by @supabase/ssr. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
