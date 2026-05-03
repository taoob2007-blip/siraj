import { getServiceSupabaseClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/lib/types'

// ── SQL to run in Supabase SQL Editor ─────────────────────────────────────────
//
// CREATE TABLE IF NOT EXISTS public.notifications (
//   id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   title      TEXT NOT NULL,
//   message    TEXT NOT NULL,
//   type       TEXT NOT NULL DEFAULT 'system',
//   read       BOOLEAN NOT NULL DEFAULT FALSE,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
// );
// CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
// ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users see own notifications"    ON public.notifications FOR SELECT USING (auth.uid() = user_id);
// CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
//
// CREATE TABLE IF NOT EXISTS public.profiles (
//   id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
//   full_name  TEXT,
//   company    TEXT,
//   role       TEXT,
//   updated_at TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
//
// ─────────────────────────────────────────────────────────────────────────────

/** Server-side only — uses the service role to bypass RLS so the backend can
 *  create notifications for any user without needing their session. */
export async function createNotification(
  userId:  string,
  title:   string,
  message: string,
  type:    NotificationType = 'system',
) {
  const supabase = getServiceSupabaseClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  })
  if (error) console.error('[createNotification] failed:', error.message)
}
