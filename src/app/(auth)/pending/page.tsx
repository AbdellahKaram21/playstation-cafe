// ============================================================
// FILE: src/app/(auth)/pending/page.tsx
// URL:  /pending
//
// بتظهر لـ owner الـ tenant بتاعه status='pending'
// مفيش أي وصول للداشبورد — الداشبورد layout بيعمل redirect لهنا
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { logout }       from '@/app/actions/auth'
import { redirect }     from 'next/navigation'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // لو مش متسجل أصلاً → روح للـ login
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, tenant_id, tenants(status)')
    .eq('id', user.id)
    .single()

  // لو الـ tenant اتفعّل → روح للداشبورد
  const tenantStatus = (profile?.tenants as any)?.status
  if (tenantStatus === 'active') redirect('/dashboard')

  return (
    <div
      className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md text-center space-y-6">

        {/* الأيقونة */}
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20
                        flex items-center justify-center text-4xl mx-auto">
          ⏳
        </div>

        {/* النص */}
        <div>
          <h1 className="text-xl font-bold text-white mb-2">
            طلبك قيد المراجعة
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            شكراً <span className="text-white font-medium">{profile?.full_name ?? ''}</span>،
            تم استلام طلب تسجيل كافيهك بنجاح.
            <br />
            هنراجع بياناتك وهنتواصل معاك على
          </p>
          <p className="text-purple-400 font-medium mt-1">{profile?.email}</p>
        </div>

        {/* مؤشر الخطوات */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-right space-y-3">
          {[
            { icon: '✅', label: 'تم التسجيل',         done: true  },
            { icon: '🔍', label: 'مراجعة البيانات',     done: false },
            { icon: '🚀', label: 'تفعيل الحساب والبدء', done: false },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-lg">{step.icon}</span>
              <span className={`text-sm ${step.done ? 'text-green-400' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs">
          عادةً بيتم التفعيل خلال 24 ساعة
        </p>

        {/* زرار تسجيل الخروج */}
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            تسجيل الخروج
          </button>
        </form>

      </div>
    </div>
  )
}
