import { createBrowserClient } from '@supabase/ssr'

// Module-level singleton using createBrowserClient from @supabase/ssr.
// This stores the session in cookies — the same cookies that middleware.ts
// reads via createServerClient. Both ends see the same session on every request.
//
// Do NOT use createClient from @supabase/supabase-js here: that stores the
// session in localStorage, which the server-side middleware cannot read, causing
// a redirect loop after login (middleware sees empty cookies → sends to /login).
export const supabaseBrowserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
