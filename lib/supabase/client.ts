import { createClient } from '@supabase/supabase-js'

// Singleton browser client — createClient from @supabase/supabase-js always
// includes the session token (from localStorage) in the Authorization header.
// Do NOT use createBrowserClient from @supabase/ssr in client components for
// storage: that client reads cookies, but the Storage module reads from the
// in-memory token cache which isn't populated until getSession() is called.
export const supabaseBrowserClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
