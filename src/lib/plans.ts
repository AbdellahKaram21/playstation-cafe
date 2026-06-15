// ============================================================
// FILE: src/lib/plans.ts
// PURPOSE: كل منطق الـ plan limits في مكان واحد
//
// الفكرة:
//   - plan_limits جدول في Supabase بيحدد حدود كل خطة
//   - أي action محتاج limit check بيستدعي checkPlanLimit()
//   - لو اتعدى الحد، بيرجع error message واضح للمستخدم
//
// ملاحظة مهمة على التسمية:
//   - في DB: الخطة الأساسية اسمها 'free'
//   - في UI: بنعرضها كـ 'Normal' (مش عندنا حاجة مجانية)
//   - planLabel() هي اللي بتعمل التحويل ده
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { PlanLimits } from '@/types/database.types'

// ── الحدود الافتراضية لو قاعدة البيانات مش متاحة ────────────
// عشان التطبيق ميوقفش لو حصل error في الـ DB
const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  free:       { plan: 'free',       max_devices: 10,  max_staff: 5,   can_view_reports: true,  can_export: false },
  pro:        { plan: 'pro',        max_devices: 25,  max_staff: 15,  can_view_reports: true,  can_export: true  },
  enterprise: { plan: 'enterprise', max_devices: 999, max_staff: 999, can_view_reports: true,  can_export: true  },
}

// ============================================================
// getPlanLimits — جيب حدود خطة معينة
// ============================================================
export async function getPlanLimits(plan: string): Promise<PlanLimits> {
  try {
    // plan_limits مش محمية بـ RLS للقراءة — أي client يشتغل
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plan_limits' as any)
      .select('*')
      .eq('plan', plan)
      .single()

    if (error || !data) return DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.free
    return data as PlanLimits
  } catch {
    return DEFAULT_LIMITS[plan] ?? DEFAULT_LIMITS.free
  }
}

// ============================================================
// getTenantPlan — جيب الـ plan بتاع tenant معين
// ============================================================
export async function getTenantPlan(tenantId: string): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single()
    return data?.plan ?? 'free'
  } catch {
    return 'free'
  }
}

// ============================================================
// checkDeviceLimit — هل التينانت يقدر يضيف جهاز جديد؟
//
// بيشوف:
//   1. الـ plan بتاع الـ tenant
//   2. عدد الأجهزة الحالية
//   3. يقارن بالـ limit
//
// بيرجع:
//   { allowed: true }              — يقدر يضيف
//   { allowed: false, error: '…' } — وصل للحد
// ============================================================
export async function checkDeviceLimit(
  tenantId: string
): Promise<{ allowed: boolean; error?: string; current: number; max: number }> {
  const supabase = await createClient()

  // جيب الـ plan والعدد الحالي في نفس الوقت
  const [plan, { count }] = await Promise.all([
    getTenantPlan(tenantId),
    supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false),
  ])

  const limits  = await getPlanLimits(plan)
  const current = count ?? 0
  const max     = limits.max_devices

  if (current >= max) {
    return {
      allowed: false,
      current,
      max,
      error: `وصلت للحد الأقصى لخطة ${planLabel(plan)} (${max} أجهزة). ارفع خطتك للإضافة أكثر.`,
    }
  }

  return { allowed: true, current, max }
}

// ============================================================
// checkStaffLimit — هل التينانت يقدر يضيف موظف جديد؟
// بيعد admin + cashier بس (مش owner أو super_admin)
// ============================================================
export async function checkStaffLimit(
  tenantId: string
): Promise<{ allowed: boolean; error?: string; current: number; max: number }> {
  const supabase = await createClient()

  const [plan, { count }] = await Promise.all([
    getTenantPlan(tenantId),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('role', ['admin', 'cashier']),
  ])

  const limits  = await getPlanLimits(plan)
  const current = count ?? 0
  const max     = limits.max_staff

  if (current >= max) {
    return {
      allowed: false,
      current,
      max,
      error: `وصلت للحد الأقصى لخطة ${planLabel(plan)} (${max} موظفين). ارفع خطتك للإضافة أكثر.`,
    }
  }

  return { allowed: true, current, max }
}

// ============================================================
// getUsageSummary — ملخص الاستخدام الكامل للـ tenant
// بيستخدمه صفحة الـ settings لعرض progress bars
// ============================================================
export async function getUsageSummary(tenantId: string) {
  const supabase = await createClient()

  const plan = await getTenantPlan(tenantId)
  const limits = await getPlanLimits(plan)

  const [{ count: deviceCount }, { count: staffCount }] = await Promise.all([
    supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('role', ['admin', 'cashier']),
  ])

  return {
    plan,
    limits,
    usage: {
      devices: { current: deviceCount ?? 0, max: limits.max_devices },
      staff:   { current: staffCount  ?? 0, max: limits.max_staff   },
    },
  }
}

// ── Helper: اسم الخطة في الـ UI ──────────────────────────────
// 'free' في DB → 'Normal' في الشاشة
// مش بنغير اسم الخطة في DB عشان كل الـ logic مرتبطة بـ 'free'
export function planLabel(plan: string): string {
  if (plan === 'enterprise') return 'Enterprise'
  if (plan === 'pro')        return 'Pro'
  return 'Normal'
}
