// ============================================================
// FILE: src/app/api/cron/expire-subscriptions/route.ts
//
// ده Route Handler — يعني Next.js بيحوّله لـ API endpoint
// URL: POST /api/cron/expire-subscriptions
//
// بيتشغل تلقائياً من:
//   1. Vercel Cron (vercel.json) — كل يوم الساعة 2 AM UTC
//   2. pg_cron في Supabase — كـ backup مباشر في DB
//
// وممكن تشغّله يدوياً من زرار في لوحة الـ Admin
//
// الأمان: بيشيك على CRON_SECRET قبل ما يعمل أي حاجة
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }         from '@/lib/supabase/admin'
import { revalidatePath }            from 'next/cache'

// ── مساعد للتحقق من الـ Secret ──────────────────────────────
// بنفصّل منطق التحقق في function منفصلة عشان نستخدمه في POST و GET
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

// ── POST: تشغيل الـ Cron ─────────────────────────────────────
export async function POST(request: NextRequest) {

  // ── 1. التحقق من الـ Secret ──────────────────────────────
  if (!process.env.CRON_SECRET) {
    console.error('[Cron] CRON_SECRET غير موجود في .env.local')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. تنفيذ منطق إيقاف الاشتراكات المنتهية ─────────────
  try {
    const admin = createAdminClient()

    // استدعاء الـ SQL function اللي اتعملت في pg_cron
    // ده أحسن من إعادة كتابة نفس المنطق هنا
    const { data, error } = await admin
      .rpc('expire_overdue_subscriptions')

    if (error) throw error

    // data هو الـ JSON اللي الـ function بترجعه
    const result = data as {
      success:    boolean
      count:      number
      tenant_ids?: string[]
      message?:   string
      run_at:     string
    }

    if (!result.success) {
      throw new Error('SQL function returned failure')
    }

    console.log(`[Cron] ✅ تم إيقاف ${result.count} كافيه`)

    // لو في تغييرات، حدّث الـ cache
    if (result.count > 0) {
      revalidatePath('/admin/tenants')
      revalidatePath('/admin')
    }

    return NextResponse.json({
      success: true,
      count:   result.count,
      run_at:  result.run_at,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف'
    console.error('[Cron] ❌ فشل:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── GET: للتحقق إن الـ endpoint شغّال (health check) ─────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    status:  'ok',
    time:    new Date().toISOString(),
    message: 'Cron endpoint is active',
  })
}
