// ============================================================
// FILE: src/app/api/admin/run-cron/route.ts
//
// endpoint خاص بالـ Super Admin بيشغّل الـ Cron يدوياً
// من الـ UI (زرار CronRunner في صفحة الـ admin)
//
// الفرق عن /api/cron/expire-subscriptions:
//   - ده بيشيك على الـ Supabase session وإن الـ user هو super_admin
//   - مش محتاج CRON_SECRET
//   - آمن يتكلم منه Client Component
// ============================================================

import { NextResponse }   from 'next/server'
import { createClient }   from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function POST() {
  try {
    // ── 1. تحقق من الـ Session ────────────────────────────
    // createClient() بيقرأ الـ cookies تلقائياً
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مسموح — يجب تسجيل الدخول' }, { status: 401 })
    }

    // ── 2. تحقق إن الـ user هو super_admin ──────────────
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مسموح — super_admin فقط' }, { status: 403 })
    }

    // ── 3. شغّل الـ SQL function مباشرة ─────────────────
    // نفس الـ function اللي pg_cron بيشغّلها تلقائياً
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('expire_overdue_subscriptions')

    if (error) throw error

    const result = data as {
      success:    boolean
      count:      number
      tenant_ids?: string[]
      message?:   string
      run_at:     string
    }

    // ── 4. حدّث الـ cache لو في تغييرات ─────────────────
    if (result.count > 0) {
      revalidatePath('/admin/tenants')
      revalidatePath('/admin')
    }

    return NextResponse.json({
      success: result.success,
      count:   result.count,
      run_at:  result.run_at,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف'
    console.error('[Admin CronRunner] ❌ فشل:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
