// ============================================================
// FILE: src/app/dashboard/page.tsx
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { getUser }      from '@/app/actions/auth'
import Link             from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const user     = await getUser()

  // جلسات نشطة الآن
  const { count: activeSessionsCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // أجهزة متاحة
  const { count: availableDevicesCount } = await supabase
    .from('devices')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('is_deleted', false)

  // إيرادات النهارده
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('total_price')
    .eq('status', 'ended')
    .gte('end_time', today.toISOString())

  const todayRevenue = todaySessions?.reduce(
    (sum, s) => sum + (s.total_price || 0), 0
  ) ?? 0

  // منتجات نفدت
  const { count: outOfStockCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('quantity', 0)
    .eq('is_active', true)

  // آخر 5 جلسات
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('id, status, start_time, end_time, total_price, devices ( name, type )')
    .order('created_at', { ascending: false })
    .limit(5)

  // ── بيانات الـ Subscription للـ Banner ─────────────────────
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('end_date, status, plan')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // احسب الأيام المتبقية لو في end_date
  let subDaysLeft: number | null = null
  if (subscription?.end_date) {
    const diff = new Date(subscription.end_date).getTime() - Date.now()
    subDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // هل نعرض البانر؟
  // - الـ subscription انتهت (daysLeft <= 0)
  // - أو هتخلص خلال 7 أيام
  const showSubBanner = subDaysLeft !== null && subDaysLeft <= 7

  // ─────────────────────────────────────────────────────────

  const stats = [
    { label: 'جلسات نشطة',    value: activeSessionsCount ?? 0,         icon: '🎮', color: 'purple', sub: 'الآن'        },
    { label: 'أجهزة متاحة',   value: availableDevicesCount ?? 0,        icon: '✅', color: 'green',  sub: 'جاهزة'       },
    { label: 'إيرادات اليوم', value: `${todayRevenue.toFixed(0)} ج`,   icon: '💰', color: 'yellow', sub: 'جنيه مصري'   },
    { label: 'منتجات نفدت',   value: outOfStockCount ?? 0,              icon: '📦', color: outOfStockCount ? 'red' : 'gray', sub: 'تحتاج تعبئة' },
  ]

  const borderColor: Record<string, string> = {
    purple: 'border-purple-500/30 bg-purple-500/5',
    green:  'border-green-500/30  bg-green-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    red:    'border-red-500/30    bg-red-500/5',
    gray:   'border-white/10      bg-white/5',
  }
  const textColor: Record<string, string> = {
    purple: 'text-purple-300',
    green:  'text-green-300',
    yellow: 'text-yellow-300',
    red:    'text-red-300',
    gray:   'text-gray-400',
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl pt-10 lg:pt-0" dir="rtl">

      {/* ── Subscription Banner ──────────────────────────────── */}
      {/* بيظهر بس لو الـ subscription قربت تخلص أو خلصت */}
      {showSubBanner && (
        <div className={`rounded-xl border p-4 flex items-center gap-3
          ${subDaysLeft! <= 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
          <span className="text-2xl shrink-0">
            {subDaysLeft! <= 0 ? '🔴' : '⚠️'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-semibold
              ${subDaysLeft! <= 0 ? 'text-red-300' : 'text-yellow-300'}`}>
              {subDaysLeft! <= 0
                ? 'انتهى اشتراكك!'
                : `اشتراكك ينتهي خلال ${subDaysLeft} ${subDaysLeft === 1 ? 'يوم' : 'أيام'}`
              }
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              جدّد اشتراكك للاستمرار في استخدام جميع المميزات
            </p>
          </div>
          <Link
            href="/dashboard/upgrade"
            className={`shrink-0 text-xs font-bold px-3 py-2 rounded-lg transition-colors
              ${subDaysLeft! <= 0
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black'
              }`}
          >
            جدّد الآن
          </Link>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-white">
          أهلاً، {user?.full_name?.split(' ')[0] ?? 'بك'} 👋
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 md:p-5 ${borderColor[stat.color]}`}>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-xl md:text-2xl">{stat.icon}</span>
              <span className="text-xs text-gray-500">{stat.sub}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${textColor[stat.color]} mb-1`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Sessions ── */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">آخر الجلسات</h2>
          <span className="text-xs text-gray-500">آخر 5 جلسات</span>
        </div>

        {recentSessions && recentSessions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {recentSessions.map((session) => {
              const duration = session.end_time
                ? Math.ceil(
                    (new Date(session.end_time).getTime() -
                     new Date(session.start_time).getTime()) / 60000
                  )
                : null
              const deviceInfo = session.devices as { name: string; type: string } | null

              return (
                <div key={session.id} className="flex items-center justify-between px-4 md:px-5 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/20
                                    flex items-center justify-center text-sm shrink-0">
                      🎮
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {deviceInfo?.name ?? 'جهاز غير معروف'}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="hidden sm:inline">{deviceInfo?.type} • </span>
                        {new Date(session.start_time).toLocaleTimeString('ar-EG', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {duration && (
                      <span className="hidden sm:block text-xs text-gray-500">{duration} دقيقة</span>
                    )}
                    {session.total_price !== null && (
                      <span className="text-sm font-semibold text-white">
                        {session.total_price} ج
                      </span>
                    )}
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${session.status === 'active'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                      }
                    `}>
                      {session.status === 'active' ? 'نشط' : 'منتهي'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-sm text-gray-400">لا توجد جلسات بعد</p>
            <p className="text-xs text-gray-600 mt-1">ابدأ جلسة جديدة من صفحة الأجهزة</p>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'جلسة جديدة',    icon: '▶️', href: '/dashboard/pos'      },
          { label: 'إدارة الأجهزة', icon: '🖥️', href: '/dashboard/devices'  },
          { label: 'المنتجات',      icon: '📦', href: '/dashboard/products' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/5
                       bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10
                       transition-all duration-150 group"
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {action.label}
            </span>
            <span className="mr-auto text-gray-600 group-hover:text-gray-400 transition-colors text-lg">←</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
