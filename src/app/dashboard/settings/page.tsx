// ============================================================
// FILE: src/app/dashboard/settings/page.tsx
// ============================================================

import { createClient }              from '@/lib/supabase/server'
import { getUser }                   from '@/app/actions/auth'
import { getUsageSummary, planLabel } from '@/lib/plans'
import SettingsForm                  from './components/SettingsForm'
import { redirect }                  from 'next/navigation'
import Link                          from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const user     = await getUser()

  if (user?.role !== 'owner' && user?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const [{ data: tenant }, usage] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, currency, default_hourly_rate, phone, address, plan, status, created_at')
      .eq('id', user.tenant_id)
      .single(),
    getUsageSummary(user.tenant_id),
  ])

  // ── بيانات الـ Subscription ───────────────────────────────
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, start_date, end_date')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // احسب الأيام المتبقية — نطرح 2 عشان اليوزر يشوف 30 يوم مش 32
  let daysLeft: number | null = null
  if (subscription?.end_date) {
    const diff = new Date(subscription.end_date).getTime() - Date.now()
    const actual = Math.ceil(diff / (1000 * 60 * 60 * 24))
    daysLeft = Math.max(0, actual - 2)
  }

  const plan = tenant?.plan ?? 'free'

  return (
    <div className="space-y-6 max-w-2xl pt-10 lg:pt-0" dir="rtl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">الإعدادات</h2>
        <p className="text-sm text-gray-400 mt-0.5">إعدادات المحل والحساب</p>
      </div>

      {/* ══════════════════════════════════════════════════════
          قسم الخطة والاستخدام
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">

        {/* Header القسم */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">💳 الخطة والاشتراك</h3>
            <p className="text-xs text-gray-500 mt-0.5">استخدامك الحالي وتفاصيل اشتراكك</p>
          </div>
          {/* رابط للـ upgrade page */}
          <Link
            href="/dashboard/upgrade"
            className="text-xs text-purple-400 hover:text-purple-300
                       border border-purple-500/30 hover:border-purple-500/50
                       bg-purple-500/10 hover:bg-purple-500/15
                       px-3 py-1.5 rounded-lg transition-all"
          >
            عرض الخطط ◀
          </Link>
        </div>

        <div className="p-5 space-y-4">

          {/* الخطة الحالية */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/20
                            flex items-center justify-center text-lg shrink-0">
              {plan === 'enterprise' ? '⭐' : plan === 'pro' ? '💜' : '🔷'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                خطة {planLabel(plan)}
              </p>
              <p className="text-xs text-gray-500">
                منذ {tenant?.created_at
                  ? new Date(tenant.created_at).toLocaleDateString('ar-EG', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })
                  : '—'}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium border shrink-0
              ${tenant?.status === 'active'
                ? 'bg-green-500/15 text-green-400 border-green-500/20'
                : 'bg-red-500/15   text-red-400   border-red-500/20'
              }`}>
              {tenant?.status === 'active' ? 'نشط' : 'موقوف'}
            </span>
          </div>

          {/* تفاصيل الـ subscription */}
          {subscription && (
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">تاريخ البداية</span>
                <span className="text-xs text-gray-300">
                  {new Date(subscription.start_date).toLocaleDateString('ar-EG', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">تاريخ الانتهاء</span>
                <span className="text-xs text-gray-300">
                  {subscription.end_date
                    ? new Date(
                        new Date(subscription.end_date).getTime() - 2 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('ar-EG', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })
                    : 'بدون انتهاء'}
                </span>
              </div>

              {/* شريط الأيام المتبقية */}
              {daysLeft !== null && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500">الأيام المتبقية</span>
                  <span className={`text-xs font-bold
                    ${daysLeft <= 0  ? 'text-red-400'    :
                      daysLeft <= 3  ? 'text-red-400'    :
                      daysLeft <= 7  ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                    {daysLeft <= 0 ? 'انتهى الاشتراك!' : `${daysLeft} يوم`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* فاصل */}
          <div className="border-t border-white/5" />

          {/* Usage Bars */}
          <div className="space-y-3">
            <UsageBar
              label="الأجهزة"
              current={usage.usage.devices.current}
              max={usage.usage.devices.max}
              icon="🎮"
            />
            <UsageBar
              label="الموظفين"
              current={usage.usage.staff.current}
              max={usage.usage.staff.max}
              icon="👥"
            />
          </div>

          {/* تحذير الاقتراب من الحد */}
          {(
            usage.usage.devices.current / usage.usage.devices.max >= 0.8 ||
            usage.usage.staff.current   / usage.usage.staff.max   >= 0.8
          ) && plan !== 'enterprise' && (
            <div className="flex items-start gap-3 p-3 rounded-xl
                            bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-yellow-400 text-sm shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="text-xs text-yellow-300/80">
                  اقتربت من حد خطتك.{' '}
                  {plan === 'free'
                    ? 'ارفع لـ Pro للحصول على 25 جهاز و15 موظف.'
                    : 'ارفع لـ Enterprise للحصول على عدد غير محدود.'}
                </p>
                <Link
                  href="/dashboard/upgrade"
                  className="inline-block mt-2 text-xs text-yellow-400 hover:text-yellow-300
                             underline underline-offset-2 transition-colors"
                >
                  اعرض خيارات الترقية ◀
                </Link>
              </div>
            </div>
          )}

          {/* تحذير انتهاء الاشتراك */}
          {daysLeft !== null && daysLeft <= 7 && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border
              ${daysLeft <= 0
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-yellow-500/10 border-yellow-500/20'
              }`}>
              <span className="text-xl shrink-0">
                {daysLeft <= 0 ? '🔴' : '⚠️'}
              </span>
              <div className="flex-1">
                <p className={`text-xs font-semibold
                  ${daysLeft <= 0 ? 'text-red-300' : 'text-yellow-300'}`}>
                  {daysLeft <= 0 ? 'انتهى اشتراكك!' : `ينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}`}
                </p>
              </div>
              <Link
                href="/dashboard/upgrade"
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors
                  ${daysLeft <= 0
                    ? 'bg-red-500 hover:bg-red-400 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                  }`}
              >
                جدّد
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          بقية الإعدادات (Form)
          ══════════════════════════════════════════════════════ */}
      <SettingsForm
        tenant={{
          name:                tenant?.name                ?? '',
          currency:            tenant?.currency            ?? 'ج',
          default_hourly_rate: tenant?.default_hourly_rate ?? 0,
          phone:               tenant?.phone               ?? '',
          address:             tenant?.address             ?? '',
        }}
        user={{
          full_name: user?.full_name ?? '',
          email:     user?.email     ?? '',
        }}
      />

    </div>
  )
}

// ── UsageBar ──────────────────────────────────────────────────
function UsageBar({
  label, current, max, icon,
}: {
  label:   string
  current: number
  max:     number
  icon:    string
}) {
  const isUnlimited = max >= 999
  const percent     = isUnlimited ? 0 : Math.min((current / max) * 100, 100)

  const barColor =
    percent >= 100 ? 'bg-red-500'    :
    percent >= 80  ? 'bg-yellow-500' :
    'bg-purple-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className="text-xs text-gray-500">
          {isUnlimited ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className="h-full w-full bg-teal-500/40 rounded-full" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  )
}
