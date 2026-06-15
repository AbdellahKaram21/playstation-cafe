// ============================================================
// FILE: src/lib/supabase/server.ts
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'


// -----------------------------------------------------------
// createClient — للـ Server Components, Server Actions, Route Handlers
// بيقرأ الـ session من الـ cookies
// -----------------------------------------------------------
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  )
}


// -----------------------------------------------------------
// createAdminClient — للعمليات اللي محتاجة تتجاوز الـ RLS
// بيستخدم الـ Service Role Key
//
// ⚠️ استخدمه على السيرفر بس — متبعتوش للـ client أبداً
// ⚠️ بيشوف كل البيانات بدون قيود RLS
//
// متى تستخدمه؟
//   - التسجيل: إنشاء tenant + user profile قبل وجود session
//   - العمليات الإدارية اللي محتاجة صلاحيات أعلى
//
// ملاحظة: من غير <Database> generic عشان نتجنب مشاكل الـ TypeScript
// في عمليات الـ insert — الأمان بيجي من كون الكود ده على السيرفر بس
// -----------------------------------------------------------
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}