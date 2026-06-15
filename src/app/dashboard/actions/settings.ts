'use server'
// ============================================================
// FILE: src/app/dashboard/actions/settings.ts
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = { error?: string; success?: boolean }

// ============================================================
// ACTION: updateTenantSettings
// ============================================================
export async function updateTenantSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  // نجيب الـ tenant_id بتاع اليوزر
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) return { error: 'المستخدم مش موجود' }
  if (userData.role !== 'owner' && userData.role !== 'super_admin') {
    return { error: 'مش عندك صلاحية تعديل الإعدادات' }
  }

  const name                = (formData.get('name') as string)?.trim()
  const currency            = (formData.get('currency') as string)?.trim()
  const default_hourly_rate = parseFloat(formData.get('default_hourly_rate') as string)
  const phone               = (formData.get('phone') as string)?.trim() || null
  const address             = (formData.get('address') as string)?.trim() || null

  if (!name)                      return { error: 'اسم المحل مطلوب' }
  if (!currency)                  return { error: 'العملة مطلوبة' }
  if (isNaN(default_hourly_rate)) return { error: 'سعر الساعة الافتراضي غير صحيح' }

  const { error } = await supabase
    .from('tenants')
    .update({ name, currency, default_hourly_rate, phone, address })
    .eq('id', userData.tenant_id)

  if (error) {
    console.error('updateTenantSettings error:', error)
    return { error: 'فشل حفظ الإعدادات' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// ACTION: updateUserProfile — تعديل اسم المستخدم
// ============================================================
export async function updateUserProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'الاسم مطلوب' }

  const { error } = await supabase
    .from('users')
    .update({ full_name })
    .eq('id', user.id)

  if (error) return { error: 'فشل تحديث الاسم' }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
