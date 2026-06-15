'use server'
// ============================================================
// FILE: src/app/dashboard/actions/devices.ts
// ============================================================

import { createClient }       from '@/lib/supabase/server'
import { revalidatePath }     from 'next/cache'
import { checkDeviceLimit }   from '@/lib/plans'
import type { DeviceInsert, DeviceUpdate, SessionType } from '@/types/database.types'

type ActionResult = { error?: string; success?: boolean }

async function getClientAndUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, tenantId: null, role: null, userId: null }

  const { data } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  return { supabase, userId: user.id, tenantId: data?.tenant_id ?? null, role: data?.role ?? null }
}

function canManageDevices(role: string | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'super_admin'
}

// ============================================================
// ACTION 1: addDevice
// ============================================================
export async function addDevice(formData: FormData): Promise<ActionResult> {
  const { supabase, tenantId, role } = await getClientAndUser()
  if (!tenantId)               return { error: 'غير مصرح' }
  if (!canManageDevices(role)) return { error: 'مش عندك صلاحية إضافة أجهزة' }

  // ── Plan Limit Check ──────────────────────────────────────
  const limitCheck = await checkDeviceLimit(tenantId)
  if (!limitCheck.allowed) return { error: limitCheck.error }

  const name       = formData.get('name') as string
  const type       = formData.get('type') as string
  const hourlyRate = parseFloat(formData.get('hourly_rate') as string)

  if (!name || !type || isNaN(hourlyRate)) return { error: 'من فضلك اكمل جميع الحقول' }
  if (hourlyRate <= 0) return { error: 'السعر لازم يكون أكبر من صفر' }

  const { error } = await supabase.from('devices').insert({
    tenant_id:   tenantId,
    name,
    type:        type as DeviceInsert['type'],
    hourly_rate: hourlyRate,
    status:      'available',
  })

  if (error) {
    console.error('addDevice error:', error)
    return { error: 'فشل إضافة الجهاز' }
  }

  revalidatePath('/dashboard/devices')
  return { success: true }
}

// ============================================================
// ACTION 2: updateDevice
// ============================================================
export async function updateDevice(deviceId: string, data: DeviceUpdate): Promise<ActionResult> {
  const { supabase, role } = await getClientAndUser()
  if (!canManageDevices(role)) return { error: 'مش عندك صلاحية تعديل الأجهزة' }

  const { error } = await supabase.from('devices').update(data).eq('id', deviceId)
  if (error) return { error: 'فشل تعديل الجهاز' }

  revalidatePath('/dashboard/devices')
  return { success: true }
}

// ============================================================
// ACTION 3: deleteDevice
// ============================================================
export async function deleteDevice(deviceId: string): Promise<ActionResult> {
  const { supabase, role } = await getClientAndUser()
  if (!canManageDevices(role)) return { error: 'مش عندك صلاحية حذف الأجهزة' }

  const { data: activeSession } = await supabase
    .from('sessions').select('id').eq('device_id', deviceId).eq('status', 'active').maybeSingle()

  if (activeSession) return { error: 'مش ممكن تحذف جهاز وعليه جلسة نشطة' }

  const { error } = await supabase.from('devices').update({ is_deleted: true } as any).eq('id', deviceId)
  if (error) return { error: 'فشل حذف الجهاز' }

  revalidatePath('/dashboard/devices')
  return { success: true }
}

// ============================================================
// ACTION 4: startSession
// ============================================================
export async function startSession(
  deviceId: string,
  type: SessionType,
  durationMinutes?: number | null,
): Promise<ActionResult> {
  const { supabase, userId, tenantId } = await getClientAndUser()
  if (!tenantId) return { error: 'غير مصرح' }

  if (type === 'limited' && (!durationMinutes || durationMinutes <= 0)) {
    return { error: 'من فضلك حدد مدة الجلسة' }
  }

  const { data: device } = await supabase
    .from('devices').select('hourly_rate, status').eq('id', deviceId).single()

  if (!device)                       return { error: 'الجهاز مش موجود' }
  if (device.status !== 'available') return { error: 'الجهاز مش متاح دلوقتي' }

  const { error: sessionError } = await supabase.from('sessions').insert({
    tenant_id:        tenantId,
    device_id:        deviceId,
    started_by:       userId,
    hourly_rate:      device.hourly_rate,
    status:           'active',
    type,
    duration_minutes: type === 'limited' ? durationMinutes : null,
  })

  if (sessionError) return { error: 'فشل بدء الجلسة' }

  await supabase.from('devices').update({ status: 'in_use' }).eq('id', deviceId)
  revalidatePath('/dashboard/devices')
  return { success: true }
}

// ============================================================
// ACTION 5: endSession
// ============================================================
export async function endSession(sessionId: string): Promise<ActionResult> {
  const { supabase } = await getClientAndUser()

  const { data: session } = await supabase
    .from('sessions').select('*').eq('id', sessionId).eq('status', 'active').single()

  if (!session) return { error: 'الجلسة مش موجودة أو منتهية بالفعل' }

  const endTime         = new Date()
  const durationMinutes = Math.ceil((endTime.getTime() - new Date(session.start_time).getTime()) / 60000)
  const sessionPrice    = parseFloat(((durationMinutes / 60) * session.hourly_rate).toFixed(2))
  const totalPrice      = parseFloat((sessionPrice + (session.products_total ?? 0)).toFixed(2))

  const { error } = await supabase.from('sessions').update({
    status: 'ended', end_time: endTime.toISOString(),
    duration_minutes: durationMinutes, session_price: sessionPrice, total_price: totalPrice,
  }).eq('id', sessionId)

  if (error) return { error: 'فشل إنهاء الجلسة' }

  await supabase.from('devices').update({ status: 'available' }).eq('id', session.device_id)

  revalidatePath('/dashboard/devices')
  revalidatePath('/dashboard/pos')
  return { success: true }
}
