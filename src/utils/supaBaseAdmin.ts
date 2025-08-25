import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // wajib ada
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // JANGAN dipakai di client
  { auth: { persistSession: false } }
);
