'use server'

// ============================================================
// FILE: src/app/dashboard/upgrade/actions.ts
// ============================================================

'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'  // ✅ صح — مش من /admin
import { getUser }           from '@/app/actions/auth'
import { revalidatePath }    from 'next/cache'

const PLAN_ORDER = ['free', 'pro', 'enterprise']

// ── requestUpgrade ────────────────────────────────────────────
export async function requestUpgrade(toPlan: string) {
  const supabase = await createClient()
  const user     = await getUser()

  if (!user || (user.role !== 'owner' && user.role !== 'super_admin')) {
    return { error: 'غير مصرح' }
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', user.tenant_id)
    .single()

  if (!tenant) return { error: 'لم يتم العثور على بيانات المحل' }
  if (tenant.plan === toPlan) return { error: 'أنت على هذه الخطة بالفعل' }

  const currentIndex = PLAN_ORDER.indexOf(tenant.plan)
  const targetIndex  = PLAN_ORDER.indexOf(toPlan)
  const requestType  = targetIndex > currentIndex ? 'upgrade' : 'downgrade'

  const { data: existing } = await supabase
    .from('upgrade_requests')
    .select('id')
    .eq('tenant_id', user.tenant_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'لديك طلب قيد الانتظار بالفعل' }

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

// ── approveUpgrade ────────────────────────────────────────────
export async function approveUpgrade(requestId: string) {
  const user = await getUser()
  if (user?.role !== 'super_admin') return { error: 'غير مصرح' }

  const admin = createAdminClient()  // ✅ من server.ts

  const { data: request } = await admin
    .from('upgrade_requests')
    .select('tenant_id, to_plan, from_plan, request_type')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'الطلب غير موجود' }

  const now     = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + 32)

  await admin
    .from('tenants')
    .update({ plan: request.to_plan, status: 'active' })
    .eq('id', request.tenant_id)

  await admin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('tenant_id', request.tenant_id)
    .eq('status', 'active')

  await admin
    .from('subscriptions')
    .insert({
      tenant_id:  request.tenant_id,
      plan:       request.to_plan,
      status:     'active',
      start_date: now.toISOString(),
      end_date:   endDate.toISOString(),
    })

  await admin
    .from('upgrade_requests')
    .update({ status: 'approved', updated_at: now.toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/upgrade-requests')
  revalidatePath('/dashboard/upgrade')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ── rejectUpgrade ─────────────────────────────────────────────
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

// ── expireOverdueSubscriptions ────────────────────────────────
export async function expireOverdueSubscriptions() {
  const user = await getUser()
  if (user?.role !== 'super_admin') return { error: 'غير مصرح' }

  const admin = createAdminClient()
  const now   = new Date().toISOString()

  const { data: expired } = await admin
    .from('subscriptions')
    .select('tenant_id')
    .eq('status', 'active')
    .lt('end_date', now)

  if (!expired || expired.length === 0) {
    return { success: true, count: 0 }
  }

  const tenantIds = expired.map(s => s.tenant_id)

  await admin
    .from('tenants')
    .update({ status: 'suspended' })
    .in('id', tenantIds)

  await admin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('end_date', now)

  revalidatePath('/admin/upgrade-requests')
  return { success: true, count: tenantIds.length }
}
