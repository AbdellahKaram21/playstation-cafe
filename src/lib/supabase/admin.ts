// ============================================================
// FILE: src/lib/supabase/admin.ts
// PURPOSE: Supabase client بيستخدم Service Role Key
//          بيتجاوز RLS تماماً — يُستخدم بس في Server-side
//          للعمليات اللي محتاجة صلاحيات super_admin
//
// ⚠️ مهم: لا تستخدمه في Client Components أبداً
//          ولا تبعت الـ service role key للـ browser
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase env vars for admin client')
  }

  // auth.persistSession: false — السيرفر مش محتاج يحفظ session
  // autoRefreshToken: false  — مش محتاج refresh في السيرفر
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession:  false,
      autoRefreshToken: false,
    },
  })
}
