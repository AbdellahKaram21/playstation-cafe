'use server'
// ============================================================
// FILE: src/app/admin/actions.ts
// ============================================================

import { createAdminClient } from '@/lib/supabase/server'
import { getUser }           from '@/app/actions/auth'
import { revalidatePath }    from 'next/cache'

async function requireSuperAdmin() {
  const user = await getUser()
  if (!user || user.role !== 'super_admin') {
    throw new Error('غير مصرح — super_admin فقط')
  }
  return user
}

// ============================================================
// getTenants
// ============================================================
export async function getTenants() {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const { data: tenants, error } = await admin
    .from('tenants')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error('فشل جلب الكافيهات')

  const { data: userCounts }   = await admin.from('users').select('tenant_id')
  const { data: deviceCounts } = await admin.from('devices').select('tenant_id').eq('is_deleted', false)
  const { data: subscriptions } = await admin.from('subscriptions').select('tenant_id, plan, status, start_date, end_date').eq('status', 'active')

  const userCountMap   = (userCounts   ?? []).reduce<Record<string, number>>((acc, u) => { acc[u.tenant_id] = (acc[u.tenant_id] ?? 0) + 1; return acc }, {})
  const deviceCountMap = (deviceCounts ?? []).reduce<Record<string, number>>((acc, d) => { acc[d.tenant_id] = (acc[d.tenant_id] ?? 0) + 1; return acc }, {})
  const subMap         = (subscriptions ?? []).reduce<Record<string, any>>((acc, s)   => { if (s) acc[s.tenant_id] = s; return acc }, {})

  return (tenants ?? []).map(tenant => ({
    ...tenant,
    userCount:    userCountMap[tenant.id]   ?? 0,
    deviceCount:  deviceCountMap[tenant.id] ?? 0,
    subscription: subMap[tenant.id]         ?? null,
  }))
}

// ============================================================
// getTenantById
// ============================================================
export async function getTenantById(tenantId: string) {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const [
    { data: tenant },
    { data: users },
    { data: devices },
    { data: sessions },
    { data: subscription },
  ] = await Promise.all([
    admin.from('tenants').select('*').eq('id', tenantId).single(),
    admin.from('users').select('id, full_name, email, role, created_at').eq('tenant_id', tenantId),
    admin.from('devices').select('id, name, type, status').eq('tenant_id', tenantId).eq('is_deleted', false),
    admin.from('sessions').select('id, status, total_price, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    admin.from('subscriptions').select('*').eq('tenant_id', tenantId).single(),
  ])

  if (!tenant) throw new Error('الكافيه مش موجود')

  const totalRevenue = (sessions ?? []).reduce((sum, s) => sum + (s.total_price ?? 0), 0)

  return { tenant, users: users ?? [], devices: devices ?? [], sessions: sessions ?? [], subscription, totalRevenue }
}

// ============================================================
// updateTenantStatus — تفعيل / تعليق / قبول
// ============================================================
export async function updateTenantStatus(
  tenantId: string,
  status: 'active' | 'suspended' | 'pending'
) {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const { error } = await admin
    .from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) throw new Error('فشل تحديث الحالة')

  revalidatePath('/admin/tenants')
  revalidatePath(`/admin/tenants/${tenantId}`)
}

// ============================================================
// activateTenant — قبول طلب تسجيل كافيه pending
// ============================================================
export async function activateTenant(tenantId: string) {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const { error } = await admin
    .from('tenants')
    .update({ status: 'active' })
    .eq('id', tenantId)
    .eq('status', 'pending')

  if (error) {
    return { error: 'فشل التفعيل، حاول مرة أخرى' }
  }

  revalidatePath('/admin/tenants')
  revalidatePath(`/admin/tenants/${tenantId}`)

  return { success: true }
}

// ============================================================
// updateSubscriptionPlan
// ============================================================
export async function updateSubscriptionPlan(tenantId: string, plan: 'free' | 'pro' | 'enterprise') {
  await requireSuperAdmin()

  const admin = createAdminClient()

  await admin.from('tenants').update({ plan }).eq('id', tenantId)

  const { error } = await admin
    .from('subscriptions')
    .update({ plan, status: 'active' })
    .eq('tenant_id', tenantId)

  if (error) throw new Error('فشل تحديث الاشتراك')

  revalidatePath('/admin/tenants')
  revalidatePath(`/admin/tenants/${tenantId}`)
}

// ============================================================
// getAdminStats
// ============================================================
export async function getAdminStats() {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const [
    { count: totalTenants },
    { count: activeTenants },
    { count: pendingTenants },
    { count: totalUsers },
    { count: totalDevices },
    { count: activeSessions },
    { data: recentTenants },
  ] = await Promise.all([
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_deleted', false),
    admin.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('is_deleted', false),
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('devices').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    admin.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('tenants').select('id, name, plan, status, created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
  ])

  return {
    totalTenants:   totalTenants   ?? 0,
    activeTenants:  activeTenants  ?? 0,
    pendingTenants: pendingTenants ?? 0,
    totalUsers:     totalUsers     ?? 0,
    totalDevices:   totalDevices   ?? 0,
    activeSessions: activeSessions ?? 0,
    recentTenants:  recentTenants  ?? [],
  }
}

// ============================================================
// createTenant
// ============================================================
export async function createTenant(formData: FormData) {
  await requireSuperAdmin()

  const admin   = createAdminClient()
  const name    = (formData.get('name')    as string)?.trim()
  const plan    = (formData.get('plan')    as string) ?? 'free'
  const phone   = (formData.get('phone')   as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null

  if (!name) return { error: 'اسم الكافيه مطلوب' }

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ name, plan, status: 'active', phone, address, is_deleted: false })
    .select('id')
    .single()

  if (tenantError || !tenant) return { error: 'فشل إنشاء الكافيه' }

  const { error: subError } = await admin
    .from('subscriptions')
    .insert({ tenant_id: tenant.id, plan, status: 'active' })

  if (subError) {
    await admin.from('tenants').delete().eq('id', tenant.id)
    return { error: 'فشل إنشاء الاشتراك' }
  }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin')

  return { success: true, tenantId: tenant.id }
}

// ============================================================
// hardDeleteTenant — حذف نهائي كامل (super_admin فقط)
// بيحذف الـ tenant + كل بياناته + auth.users (الإيميل بيتحرر)
// ============================================================
export async function hardDeleteTenant(tenantId: string) {
  await requireSuperAdmin()

  const admin = createAdminClient()

  // نتأكد إن الـ tenant موجود الأول
  const { data: tenant } = await admin
    .from('tenants')
    .select('name, status')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { error: 'الكافيه مش موجود' }

  // نستدعي الـ DB function اللي بتعمل الحذف الكامل
  const { data, error } = await admin.rpc('hard_delete_tenant', {
    p_tenant_id: tenantId,
  })

  if (error) return { error: 'فشل الحذف النهائي: ' + error.message }
  if ((data as any)?.error) return { error: (data as any).error }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin')

  return { success: true }
}

// ============================================================
// softDeleteTenant
// ============================================================
export async function softDeleteTenant(tenantId: string) {
  await requireSuperAdmin()

  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('status, name')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { error: 'الكافيه مش موجود' }

  if (tenant.status === 'active') return { error: 'لازم توقّف الكافيه الأول قبل الحذف' }

  const { error } = await admin
    .from('tenants')
    .update({ is_deleted: true })
    .eq('id', tenantId)

  if (error) return { error: 'فشل حذف الكافيه' }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin')

  return { success: true }
}
