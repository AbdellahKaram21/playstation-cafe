// ============================================================
// FILE: src/app/admin/page.tsx
// PURPOSE: صفحة الإحصائيات العامة للـ SaaS — Super Admin فقط
// ============================================================

import Link          from 'next/link'
import { getAdminStats } from './actions'
import { CronRunner } from './components/CronRunner'

export default async function AdminPage() {
  const stats = await getAdminStats()

  const cards = [
    { label: 'إجمالي الكافيهات',  value: stats.totalTenants,   icon: '🏪', color: 'purple', sub: 'مسجلة'        },
    { label: 'كافيهات نشطة',      value: stats.activeTenants,  icon: '✅', color: 'green',  sub: 'شغالة دلوقتي' },
    { label: 'إجمالي المستخدمين', value: stats.totalUsers,     icon: '👥', color: 'blue',   sub: 'كل الـ tenants' },
    { label: 'أجهزة نشطة الآن',   value: stats.activeSessions, icon: '🎮', color: 'red',    sub: 'جلسة مفتوحة'  },
  ]

  const borderColor: Record<string, string> = {
    purple: 'border-purple-500/30 bg-purple-500/5',
    green:  'border-green-500/30  bg-green-500/5',
    blue:   'border-blue-500/30   bg-blue-500/5',
    red:    'border-red-500/30    bg-red-500/5',
  }
  const textColor: Record<string, string> = {
    purple: 'text-purple-300',
    green:  'text-green-300',
    blue:   'text-blue-300',
    red:    'text-red-300',
  }

  return (
    <div className="space-y-6 max-w-6xl" dir="rtl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">إحصائيات النظام 📊</h2>
        <p className="text-sm text-gray-400 mt-0.5">نظرة شاملة على كل الكافيهات المسجلة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map(card => (
          <div key={card.label} className={`rounded-xl border p-4 md:p-5 ${borderColor[card.color]}`}>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-xl md:text-2xl">{card.icon}</span>
              <span className="text-xs text-gray-500">{card.sub}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${textColor[card.color]} mb-1`}>
              {card.value}
            </p>
            <p className="text-xs text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* نسبة الكافيهات النشطة */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">نسبة التفعيل</h3>
          <span className="text-xs text-gray-500">
            {stats.activeTenants} من {stats.totalTenants}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: stats.totalTenants > 0
                ? `${Math.round((stats.activeTenants / stats.totalTenants) * 100)}%`
                : '0%'
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {stats.totalTenants > 0
            ? `${Math.round((stats.activeTenants / stats.totalTenants) * 100)}% من الكافيهات نشطة`
            : 'لا توجد كافيهات بعد'}
        </p>
      </div>

      {/* ── Cron Job Runner ── */}
      <CronRunner />

      {/* آخر الكافيهات المسجلة */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">آخر الكافيهات المسجلة</h3>
          <Link
            href="/admin/tenants"
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>

        {stats.recentTenants.length > 0 ? (
          <div className="divide-y divide-white/5">
            {stats.recentTenants.map(tenant => (
              <Link
                key={tenant.id}
                href={`/admin/tenants/${tenant.id}`}
                className="flex items-center justify-between px-5 py-3 gap-3
                           hover:bg-white/[0.03] transition-colors"
              >
                {/* اسم الكافيه */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/20
                                  flex items-center justify-center text-sm shrink-0">
                    🏪
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>

                {/* Plan + Status */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium border
                    ${tenant.plan === 'enterprise' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                    : tenant.plan === 'pro'        ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                    :                               'bg-gray-500/15  text-gray-400  border-gray-500/20'}
                  `}>
                    {tenant.plan === 'enterprise' ? 'Enterprise'
                    : tenant.plan === 'pro'        ? 'Pro'
                    :                               'Free'}
                  </span>
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium border
                    ${tenant.status === 'active'
                      ? 'bg-green-500/15 text-green-400 border-green-500/20'
                      : 'bg-red-500/15   text-red-400   border-red-500/20'}
                  `}>
                    {tenant.status === 'active' ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm text-gray-400">لا توجد كافيهات مسجلة بعد</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          href="/admin/tenants"
          className="flex items-center gap-3 p-4 rounded-xl border border-white/5
                     bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10
                     transition-all duration-150 group"
        >
          <span className="text-xl">🏪</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              إدارة الكافيهات
            </p>
            <p className="text-xs text-gray-500">عرض وتعديل كل الـ tenants</p>
          </div>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-lg">←</span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 p-4 rounded-xl border border-white/5
                     bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10
                     transition-all duration-150 group"
        >
          <span className="text-xl">⊞</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              لوحة التحكم
            </p>
            <p className="text-xs text-gray-500">الرجوع للداشبورد العادي</p>
          </div>
          <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-lg">←</span>
        </Link>
      </div>

    </div>
  )
}
