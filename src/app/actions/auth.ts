'use server'
// ============================================================
// FILE: src/app/actions/auth.ts
// Server Actions للـ Auth — كل العمليات دي بتحصل على السيرفر
// مش في المتصفح — وده أهم من الأمان
// ============================================================

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ActionResult = {
  error?: string
  success?: boolean
}

// ============================================================
// registerWithPassword — تسجيل كافيه جديد بـ Email + Password
//
// الخطوات:
//   1. ننشئ auth user بـ signUp (email + password)
//   2. ننشئ tenant بـ status='pending'
//   3. ننشئ profile في جدول users
//   4. ننشئ subscription
//
// ملاحظة: status='pending' يعني في انتظار موافقة السوبر أدمن
// ============================================================
export async function registerWithPassword(formData: FormData): Promise<ActionResult> {
  // نجيب البيانات من الفورم
  const cafeName = (formData.get('cafe_name') as string)?.trim()
  const fullName = (formData.get('full_name') as string)?.trim()
  const email    = (formData.get('email')     as string)?.trim()
  const password = (formData.get('password')  as string)
  const phone    = (formData.get('phone')     as string)?.trim() || null
  const address  = (formData.get('address')   as string)?.trim() || null

  // تحقق بسيط من الحقول المطلوبة
  if (!cafeName || !fullName || !email || !password) {
    return { error: 'من فضلك أكمل جميع الحقول المطلوبة' }
  }

  if (password.length < 8) {
    return { error: 'كلمة السر لازم تكون 8 حروف على الأقل' }
  }

  // createAdminClient = يستخدم service_role key → يتجاوز الـ RLS
  // محتاجينه عشان ننشئ tenant و users بدون قيود
  const admin = createAdminClient()

  // STEP 1: ننشئ الـ auth user
  // signUp بيعمل مستخدم في auth.users في سوبيس
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ← مهم: نتجاوز تأكيد الإيميل (لأننا نظام SaaS + manual approval)
    user_metadata: { full_name: fullName },
  })

  if (authError || !authData.user) {
    // لو الإيميل مسجل بالفعل
    if (authError?.message.includes('already been registered') ||
        authError?.message.includes('already exists')) {
      return { error: 'الإيميل ده مسجل بالفعل، جرب تسجيل الدخول' }
    }
    console.error('registerWithPassword — auth error:', authError)
    return { error: 'فشل إنشاء الحساب، حاول مرة أخرى' }
  }

  // STEP 2: ننشئ الـ Tenant بـ status='pending'
  // 'pending' = في انتظار موافقة السوبر أدمن قبل الدخول
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name:    cafeName,
      plan:    'free',
      status:  'pending',
      phone,
      address,
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    // لو فشل إنشاء الـ tenant، نمسح الـ auth user عشان ما يفضلش بدون profile
    await admin.auth.admin.deleteUser(authData.user.id)
    console.error('registerWithPassword — tenant error:', tenantError)
    return { error: 'فشل إنشاء الكافيه، حاول مرة أخرى' }
  }

  // STEP 3: ننشئ الـ User Profile في جدول users
  const { error: profileError } = await admin
    .from('users')
    .insert({
      id:        authData.user.id,  // نفس الـ id بتاع auth.users
      tenant_id: tenant.id,
      email,
      full_name: fullName,
      role:      'owner',           // صاحب الكافيه دايماً owner
    })

  if (profileError) {
    // Rollback: نمسح الـ tenant والـ auth user لو الـ profile فشل
    await admin.from('tenants').delete().eq('id', tenant.id)
    await admin.auth.admin.deleteUser(authData.user.id)
    console.error('registerWithPassword — profile error:', profileError)
    return { error: 'فشل إنشاء الملف الشخصي، حاول مرة أخرى' }
  }

  // STEP 4: ننشئ الـ Subscription
  await admin.from('subscriptions').insert({
    tenant_id: tenant.id,
    plan:      'free',
    status:    'active',
  })

  return { success: true }
}

// ============================================================
// login — تسجيل الدخول بـ Email أو Username + Password
// ============================================================
export async function login(formData: FormData): Promise<ActionResult> {
  const identifier = (formData.get('identifier') as string)?.trim()
  const password   = formData.get('password') as string

  if (!identifier || !password) {
    return { error: 'من فضلك أدخل اسم المستخدم وكلمة السر' }
  }

  const supabase = await createClient()
  const admin    = createAdminClient()

  // نحدد إيه اللي أدخله المستخدم: إيميل أو username
  // لو فيه @ → إيميل مباشرة
  // لو مفيش @ → username → نبحث عنه في جدول users
  let email = identifier

  if (!identifier.includes('@')) {
    const { data: userRow, error: lookupError } = await admin
      .from('users')
      .select('email')
      .eq('username', identifier)
      .maybeSingle()

    if (lookupError) return { error: 'حدث خطأ، حاول مرة أخرى' }
    if (!userRow)    return { error: 'اسم المستخدم أو كلمة السر غلط' }

    email = userRow.email
  }

  // signInWithPassword = تسجيل الدخول بـ email + password
  // ده على عكس signInWithOtp (الـ magic link القديم)
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'اسم المستخدم أو كلمة السر غلط' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'الحساب لم يتم تأكيده بعد، تواصل مع الإدارة' }
    }
    return { error: 'حدث خطأ، حاول مرة أخرى' }
  }

  redirect('/dashboard')
}

// ============================================================
// logout
// ============================================================
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// getUser — نجيب بيانات المستخدم الحالي مع الـ profile
// ============================================================
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
