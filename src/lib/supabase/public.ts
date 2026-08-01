import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// A plain, session-less anon client for the public site. Unlike the
// cookie-aware server client, this never picks up a staff member's
// authenticated session, so it always renders the true public view
// regardless of who is browsing — and it doesn't force dynamic rendering.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
