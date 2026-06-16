// ============================================================
// FILE: src/app/dashboard/layout.tsx
//
// بيتحقق من:
//   1. المستخدم متسجل؟ → لأ: روح للـ login
//   2. الـ tenant بتاعه pending؟ → روح لصفحة الانتظار
//   3. بيجيب التنبيهات ويمررها للـ Header
// ============================================================

import { redirect }          from 'next/navigation'
import { getUser }           from '@/app/actions/auth'
import { createClient }      from '@/lib/supabase/server'
import { getNotifications }  from '@/lib/notifications'
import SidebarNav            from './components/SidebarNav'
import DashboardHeader       from './components/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // غير مسجل → صفحة الدخول
  if (!user) redirect('/login')

  // نتحقق من status الـ tenant
  // super_admin مش عنده tenant → نتجاوز الشرط ده
  if (user.role !== 'super_admin' && user.tenant_id) {
    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', user.tenant_id)
      .single()

    // لو الـ tenant في انتظار التفعيل → صفحة الانتظار
    if (tenant?.status === 'pending') {
      redirect('/pending')
    }
  }

  // ── جيب التنبيهات ────────────────────────────────────────
  // بنعمل try/catch عشان لو حصل error في التنبيهات
  // ما يوقفش الـ layout كله — بنعرض صفر تنبيهات بدل ما الصفحة تكسر
  let notifications: Awaited<ReturnType<typeof getNotifications>> = []
  try {
    // super_admin مش عنده tenant → مش محتاج تنبيهات
    if (user.role !== 'super_admin') {
      notifications = await getNotifications()
    }
  } catch {
    // صامت — التنبيهات اختيارية، ما بتكسرش الـ app
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ===== SIDEBAR ===== */}
      <SidebarNav userRole={user.role as "owner" | "admin" | "cashier" | "super_admin"} />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header — بنمرر التنبيهات */}
        <DashboardHeader user={user} notifications={notifications} />

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}
