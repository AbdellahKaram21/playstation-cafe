'use server'
// ============================================================
// ⚠️  DEPRECATED — لا تستخدم هذا الملف
// كل الـ actions انتقلت لـ: src/app/dashboard/actions/devices.ts
// هذا الملف موجود للمرجعية فقط وسيُحذف لاحقاً
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
// revalidatePath = بتقول لـ Next.js "جدّد البيانات في الصفحة دي"
// بعد أي تغيير في قاعدة البيانات، لازم نستدعيها عشان الصفحة تتحدث

import type { DeviceInsert, DeviceUpdate } from '@/types/database.types'

type ActionResult = {
  error?: string
  success?: boolean
}


// ============================================================
// ACTION 1: addDevice — إضافة جهاز جديد
// ============================================================
export async function addDevice(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const name        = formData.get('name') as string
  const type        = formData.get('type') as string
  const hourlyRate  = parseFloat(formData.get('hourly_rate') as string)
  // parseFloat = بيحوّل النص "50.00" لرقم عشري 50.00

  if (!name || !type || isNaN(hourlyRate)) {
    return { error: 'من فضلك اكمل جميع الحقول' }
  }

  if (hourlyRate <= 0) {
    return { error: 'السعر لازم يكون أكبر من صفر' }
  }

  // جيب الـ tenant_id بتاع اليوزر الحالي
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'فشل جلب بيانات المستخدم' }

  const { error } = await supabase.from('devices').insert({
    tenant_id:   profile.tenant_id,
    name,
    type:        type as DeviceInsert['type'],
    hourly_rate: hourlyRate,
    status:      'available',
  })

  if (error) {
    console.error('addDevice error:', error)
    return { error: 'فشل إضافة الجهاز' }
  }

  // جدّد صفحة الأجهزة عشان الجهاز الجديد يظهر
  revalidatePath('/dashboard/devices')
  return { success: true }
}


// ============================================================
// ACTION 2: updateDevice — تعديل جهاز
// ============================================================
export async function updateDevice(
  deviceId: string,
  data: DeviceUpdate
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('devices')
    .update(data)
    .eq('id', deviceId)

  if (error) {
    console.error('updateDevice error:', error)
    return { error: 'فشل تعديل الجهاز' }
  }

  revalidatePath('/dashboard/devices')
  return { success: true }
}


// ============================================================
// ACTION 3: deleteDevice — حذف جهاز
// ============================================================
export async function deleteDevice(deviceId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // تحقق إن الجهاز مش شغال دلوقتي
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('device_id', deviceId)
    .eq('status', 'active')
    .single()

  if (activeSession) {
    return { error: 'مش ممكن تحذف جهاز وعليه جلسة نشطة' }
  }

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId)

  if (error) {
    console.error('deleteDevice error:', error)
    return { error: 'فشل حذف الجهاز' }
  }

  revalidatePath('/dashboard/devices')
  return { success: true }
}


// ============================================================
// ACTION 4: startSession — بدء جلسة على جهاز
// ============================================================
export async function startSession(deviceId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // جيب بيانات اليوزر الحالي
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'فشل جلب بيانات المستخدم' }

  // جيب بيانات الجهاز (محتاجين الـ hourly_rate)
  const { data: device } = await supabase
    .from('devices')
    .select('hourly_rate, status')
    .eq('id', deviceId)
    .single()

  if (!device) return { error: 'الجهاز مش موجود' }

  if (device.status !== 'available') {
    return { error: 'الجهاز مش متاح دلوقتي' }
  }

  // ابدأ الجلسة وغيّر حالة الجهاز — الاتنين في طلبين منفصلين
  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      tenant_id:   profile.tenant_id,
      device_id:   deviceId,
      started_by:  user.id,
      hourly_rate: device.hourly_rate,
      status:      'active',
    })

  if (sessionError) {
    console.error('startSession error:', sessionError)
    return { error: 'فشل بدء الجلسة' }
  }

  // غيّر حالة الجهاز لـ 'in_use'
  await supabase
    .from('devices')
    .update({ status: 'in_use' })
    .eq('id', deviceId)

  revalidatePath('/dashboard/devices')
  return { success: true }
}


// ============================================================
// ACTION 5: endSession — إنهاء الجلسة وحساب السعر
// ============================================================
export async function endSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // جيب بيانات الجلسة
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('status', 'active')
    .single()

  if (!session) return { error: 'الجلسة مش موجودة أو منتهية بالفعل' }

  const endTime = new Date()
  const startTime = new Date(session.start_time)

  // حساب المدة بالدقائق
  // Math.ceil = تقريب لأعلى (22.3 دقيقة = 23 دقيقة)
  const durationMinutes = Math.ceil(
    (endTime.getTime() - startTime.getTime()) / 60000
  )

  // حساب سعر الجلسة
  // (عدد الدقائق / 60) * سعر الساعة
  const sessionPrice = parseFloat(
    ((durationMinutes / 60) * session.hourly_rate).toFixed(2)
  )

  const productsTotal = session.products_total ?? 0
  const totalPrice    = parseFloat((sessionPrice + productsTotal).toFixed(2))

  // حدّث الجلسة
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      status:           'ended',
      end_time:         endTime.toISOString(),
      duration_minutes: durationMinutes,
      session_price:    sessionPrice,
      total_price:      totalPrice,
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('endSession error:', updateError)
    return { error: 'فشل إنهاء الجلسة' }
  }

  // رجّع الجهاز لـ 'available'
  await supabase
    .from('devices')
    .update({ status: 'available' })
    .eq('id', session.device_id)

  revalidatePath('/dashboard/devices')
  return { success: true }
}
