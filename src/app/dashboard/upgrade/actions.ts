'use server'
// ============================================================
// FILE: src/app/dashboard/upgrade/actions.ts
//
// منطق الطلبات:
//   - أي تغيير في الخطة (ترقية أو تخفيض) → طلب pending
//   - لما super_admin يوافق → subscription تبدأ بـ 32 يوم
//   - اليوزر يشوف "شهر" بس في الـ UI
//   - بعد 30 يوم → تنبيه (يومين متبقيين)
//   - لو مفعلتش → tenant يتوقف تلقائياً
// ============================================================

'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser }           from '@/app/actions/auth'
import { revalidatePath }    from 'next/cache'

// ── ترتيب الخطط من الأدنى للأعلى ────────────────────────────
const PLAN_ORDER = ['free', 'pro', 'enterprise']

// ── requestPlanChange ─────────────────────────────────────────
// بيبعت طلب تغيير خطة (ترقية أو تخفيض)
// مش بيغير الخطة فوراً — بينتظر موافقة super_admin
export async function requestUpgrade(toPlan: string) {
  const supabase = await createClient()
  const user     = await getUser()

  if (!user || (user.role !== 'owner' && user.role !== 'super_admin')) {
    return { error: 'غير مصرح' }
  }

  // جيب الخطة الحالية
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', user.tenant_id)
    .single()

  if (!tenant) return { error: 'لم يتم العثور على بيانات المحل' }
  if (tenant.plan === toPlan) return { error: 'أنت على هذه الخطة بالفعل' }

  // حدد نوع الطلب: ترقية أم تخفيض؟
  const currentIndex = PLAN_ORDER.indexOf(tenant.plan)
  const targetIndex  = PLAN_ORDER.indexOf(toPlan)
  const requestType  = targetIndex > currentIndex ? 'upgrade' : 'downgrade'

  // تأكد مفيش طلب pending قديم
  const { data: existing } = await supabase
    .from('upgrade_requests')
    .select('id')
    .eq('tenant_id', user.tenant_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'لديك طلب قيد الانتظار بالفعل' }

  // ابعت الطلب
  const { error } = await supabase
    .from('upgrade_requests')
    .insert({
      tenant_id:    user.tenant_id,
      from_plan:    tenant.plan,
      to_plan:      toPlan,
      status:       'pending',
      request_type: requestType,
    })

  if (error) return { error: 'حدث خطأ أثناء إرسال الطلب' }

  revalidatePath('/dashboard/upgrade')
  return { success: true, requestType }
}

// ── approveUpgrade (super_admin فقط) ─────────────────────────
// لما توافق:
//   1. بيغير الخطة في tenants
//   2. بيلغي الـ subscription القديمة
//   3. بيعمل subscription جديدة بـ 32 يوم
//   4. بيفعّل الـ tenant لو كان موقوف
export async function approveUpgrade(requestId: string) {
  const user = await getUser()
  if (user?.role !== 'super_admin') return { error: 'غير مصرح' }

  const admin = createAdminClient()

  // جيب الطلب
  const { data: request } = await admin
    .from('upgrade_requests')
    .select('tenant_id, to_plan, from_plan, request_type')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'الطلب غير موجود' }

  const now     = new Date()
  // 32 يوم — اليوزر يشوف "شهر" في الـ UI
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + 32)

  // 1. غيّر الخطة في tenants + فعّل الـ tenant
  await admin
    .from('tenants')
    .update({ plan: request.to_plan, status: 'active' })
    .eq('id', request.tenant_id)

  // 2. ألغِ الـ subscriptions القديمة
  await admin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('tenant_id', request.tenant_id)
    .eq('status', 'active')

  // 3. عمل subscription جديدة بـ 32 يوم
  await admin
    .from('subscriptions')
    .insert({
      tenant_id:  request.tenant_id,
      plan:       request.to_plan,
      status:     'active',
      start_date: now.toISOString(),
      end_date:   endDate.toISOString(),
    })

  // 4. حدّث status الطلب
  await admin
    .from('upgrade_requests')
    .update({ status: 'approved', updated_at: now.toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/upgrade-requests')
  revalidatePath('/dashboard/upgrade')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ── rejectUpgrade (super_admin فقط) ──────────────────────────
export async function rejectUpgrade(requestId: string) {
  const user = await getUser()
  if (user?.role !== 'super_admin') return { error: 'غير مصرح' }

  const admin = createAdminClient()

  await admin
    .from('upgrade_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/upgrade-requests')
  return { success: true }
}

// ── expireOverdueSubscriptions (Cron Job / Manual) ───────────
// بيوقف أي tenant الـ subscription بتاعته خلصت
// المفروض يتشغل يومياً — ممكن تشغله يدوي من الـ admin
export async function expireOverdueSubscriptions() {
  const user = await getUser()
  if (user?.role !== 'super_admin') return { error: 'غير مصرح' }

  const admin = createAdminClient()
  const now   = new Date().toISOString()

  // جيب الـ subscriptions اللي خلصت ولسه active
  const { data: expired } = await admin
    .from('subscriptions')
    .select('tenant_id')
    .eq('status', 'active')
    .lt('end_date', now)   // lt = less than = end_date أقل من دلوقتي

  if (!expired || expired.length === 0) {
    return { success: true, count: 0 }
  }

  const tenantIds = expired.map(s => s.tenant_id)

  // وقّف الـ tenants
  await admin
    .from('tenants')
    .update({ status: 'suspended' })
    .in('id', tenantIds)

  // حدّث الـ subscriptions
  await admin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('end_date', now)

  revalidatePath('/admin/upgrade-requests')
  return { success: true, count: tenantIds.length }
}
