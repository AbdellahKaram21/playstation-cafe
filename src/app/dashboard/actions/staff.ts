'use server'
// ============================================================
// FILE: src/app/dashboard/actions/staff.ts
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath }                  from 'next/cache'
import { checkStaffLimit }                 from '@/lib/plans'

type ActionResult = { error?: string; success?: boolean }

// ============================================================
// ACTION 1: addStaff
// ============================================================
export async function addStaff(formData: FormData): Promise<ActionResult> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: ownerProfile } = await supabase
    .from('users').select('tenant_id, role').eq('id', user.id).single()

  if (!ownerProfile) return { error: 'فشل جلب بيانات المستخدم' }
  if (ownerProfile.role !== 'owner' && ownerProfile.role !== 'super_admin') {
    return { error: 'مش عندك صلاحية إضافة موظفين' }
  }

  // ── Plan Limit Check ──────────────────────────────────────
  const limitCheck = await checkStaffLimit(ownerProfile.tenant_id)
  if (!limitCheck.allowed) return { error: limitCheck.error }

  const fullName = (formData.get('full_name') as string)?.trim()
  const email    = (formData.get('email')     as string)?.trim()
  const username = (formData.get('username')  as string)?.trim().toLowerCase()
  const password = (formData.get('password')  as string)
  const role     = formData.get('role') as 'admin' | 'cashier'

  if (!fullName || !email || !username || !password || !role) {
    return { error: 'من فضلك اكمل جميع الحقول' }
  }
  if (password.length < 8) return { error: 'كلمة السر لازم تكون 8 حروف على الأقل' }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: 'اسم المستخدم: حروف إنجليزية صغيرة وأرقام و _ فقط' }
  }
  if (!['admin', 'cashier'].includes(role)) return { error: 'الدور غير صحيح' }

  const { data: existingUsername } = await adminSupabase
    .from('users').select('id').eq('username', username).maybeSingle()

  if (existingUsername) return { error: 'اسم المستخدم ده موجود بالفعل، اختار اسم تاني' }

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError || !authData.user) {
    if (authError?.message.includes('already been registered')) {
      return { error: 'الإيميل ده مسجل بالفعل' }
    }
    return { error: 'فشل إنشاء الحساب' }
  }

  const { error: profileError } = await adminSupabase.from('users').insert({
    id: authData.user.id, tenant_id: ownerProfile.tenant_id,
    email, full_name: fullName, username, role,
  })

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'فشل إنشاء ملف الموظف' }
  }

  revalidatePath('/dashboard/staff')
  return { success: true }
}

// ============================================================
// ACTION 2: updateStaffRole
// ============================================================
export async function updateStaffRole(staffId: string, newRole: 'admin' | 'cashier'): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: ownerProfile } = await supabase
    .from('users').select('tenant_id, role').eq('id', user.id).single()

  if (!ownerProfile) return { error: 'فشل جلب بيانات المستخدم' }
  if (ownerProfile.role !== 'owner' && ownerProfile.role !== 'super_admin') {
    return { error: 'مش عندك صلاحية تعديل الموظفين' }
  }
  if (!['admin', 'cashier'].includes(newRole)) return { error: 'الدور غير صحيح' }

  const { data: staffUser } = await supabase
    .from('users').select('tenant_id, role').eq('id', staffId).single()

  if (!staffUser)                                        return { error: 'الموظف مش موجود' }
  if (staffUser.tenant_id !== ownerProfile.tenant_id)   return { error: 'مش عندك صلاحية على الموظف ده' }
  if (staffUser.role === 'owner')                        return { error: 'مش ممكن تعدل دور الـ owner' }

  const { error } = await supabase.from('users').update({ role: newRole }).eq('id', staffId)
  if (error) return { error: 'فشل تعديل الدور' }

  revalidatePath('/dashboard/staff')
  return { success: true }
}

// ============================================================
// ACTION 3: deleteStaff
// ============================================================
export async function deleteStaff(staffId: string): Promise<ActionResult> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: ownerProfile } = await supabase
    .from('users').select('tenant_id, role').eq('id', user.id).single()

  if (!ownerProfile) return { error: 'فشل جلب بيانات المستخدم' }
  if (ownerProfile.role !== 'owner' && ownerProfile.role !== 'super_admin') {
    return { error: 'مش عندك صلاحية حذف الموظفين' }
  }

  const { data: staffUser } = await supabase
    .from('users').select('tenant_id, role').eq('id', staffId).single()

  if (!staffUser)                                        return { error: 'الموظف مش موجود' }
  if (staffUser.tenant_id !== ownerProfile.tenant_id)   return { error: 'مش عندك صلاحية على الموظف ده' }
  if (staffUser.role === 'owner')                        return { error: 'مش ممكن تحذف الـ owner' }

  await supabase.from('users').delete().eq('id', staffId)
  await adminSupabase.auth.admin.deleteUser(staffId)

  revalidatePath('/dashboard/staff')
  return { success: true }
}

// ============================================================
// ACTION 4: updateStaffPassword
// ============================================================
export async function updateStaffPassword(staffId: string, newPassword: string): Promise<ActionResult> {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const { data: ownerProfile } = await supabase
    .from('users').select('tenant_id, role').eq('id', user.id).single()

  if (!ownerProfile) return { error: 'فشل جلب بيانات المستخدم' }
  if (ownerProfile.role !== 'owner' && ownerProfile.role !== 'super_admin') {
    return { error: 'مش عندك صلاحية تغيير كلمة السر' }
  }
  if (!newPassword || newPassword.length < 8) {
    return { error: 'كلمة السر لازم تكون 8 حروف على الأقل' }
  }

  const { data: staffUser } = await supabase
    .from('users').select('tenant_id, role').eq('id', staffId).single()

  if (!staffUser)                                        return { error: 'الموظف مش موجود' }
  if (staffUser.tenant_id !== ownerProfile.tenant_id)   return { error: 'مش عندك صلاحية على الموظف ده' }
  if (staffUser.role === 'owner')                        return { error: 'مش ممكن تغير كلمة سر الـ owner' }

  const { error } = await adminSupabase.auth.admin.updateUserById(staffId, { password: newPassword })
  if (error) return { error: 'فشل تغيير كلمة السر' }

  return { success: true }
}
