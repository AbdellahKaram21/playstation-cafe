// ============================================================
// FILE: src/app/admin/tenants/[id]/page.tsx
// PURPOSE: تفاصيل كافيه واحد — إحصائيات + إدارة الاشتراك
// ============================================================

import Link from 'next/link'
import { getTenantById } from '../../actions'
import TenantActions from './TenantActions'
import { planLabel } from '@/lib/plans'

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenant, users, devices, sessions, subscription, totalRevenue } = await getTenantById(id)

  const roleLabel: Record<string, string> = {
    owner:       'مالك',
    admin:       'مدير',
    cashier:     'كاشير',
    super_admin: 'Super Admin',
  }

  const statusColor = (status: string) =>
    status === 'available' ? 'text-green-400'
    : status === 'in_use'  ? 'text-yellow-400'
    :                        'text-red-400'

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">

      {/* Back + Header */}
      <div>
        <Link
          href="/admin/tenants"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3 inline-flex items-center gap-1"
        >
          → الرجوع للكافيهات
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h2 className="text-lg font-bold text-white">{tenant.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {/* Status Badge */}
              <span className={`
                text-xs px-2 py-0.5 rounded-full border font-medium
                ${tenant.status === 'active'
                  ? 'bg-green-500/15 text-green-400 border-green-500/20'
                  : 'bg-red-500/15   text-red-400   border-red-500/20'}
              `}>
                {tenant.status === 'active' ? 'نشط' : 'موقوف'}
              </span>

              {/* Plan Badge — planLabel() بتحول 'free' → 'Normal' */}
              <span className={`
                text-xs px-2 py-0.5 rounded-full border font-medium
                ${tenant.plan === 'enterprise' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                : tenant.plan === 'pro'        ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                :                               'bg-blue-500/15   text-blue-400   border-blue-500/20'}
              `}>
                {tenant.plan === 'enterprise' ? '⭐ Enterprise'
                : tenant.plan === 'pro'        ? '💜 Pro'
                :                               planLabel(tenant.plan)}
              </span>

              <span className="text-xs text-gray-500">
                منذ {new Date(tenant.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'المستخدمين', value: users.length,   icon: '👥', color: 'text-blue-300'   },
          { label: 'الأجهزة',    value: devices.length,  icon: '🎮', color: 'text-purple-300' },
          { label: 'الجلسات',    value: sessions.length, icon: '⏱',  color: 'text-yellow-300' },
          { label: 'الإيرادات',  value: `${totalRevenue.toFixed(0)} ج`, icon: '💰', color: 'text-green-300' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <span className="text-2xl">{s.icon}</span>
            <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Actions */}
        <div className="lg:col-span-1">
          <TenantActions
            tenantId={tenant.id}
            currentStatus={tenant.status}
            currentPlan={tenant.plan}
          />

          {subscription && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mt-4">
              <h3 className="text-sm font-semibold text-white mb-3">تفاصيل الاشتراك</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">الحالة</span>
                  <span className={subscription.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                    {subscription.status === 'active' ? 'نشط' : subscription.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ البداية</span>
                  <span className="text-gray-300">
                    {new Date(subscription.start_date).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                {subscription.end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">تاريخ الانتهاء</span>
                    <span className="text-gray-300">
                      {new Date(subscription.end_date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Users + Devices */}
        <div className="lg:col-span-2 space-y-4">

          {/* Users */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">المستخدمين ({users.length})</h3>
            </div>
            {users.length > 0 ? (
              <div className="divide-y divide-white/5">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center
                                      justify-center text-xs text-purple-300 shrink-0">
                        {u.full_name?.[0] ?? u.email[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 bg-white/5 px-2 py-1 rounded-full">
                      {roleLabel[u.role] ?? u.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">لا يوجد مستخدمين</p>
            )}
          </div>

          {/* Devices */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">الأجهزة ({devices.length})</h3>
            </div>
            {devices.length > 0 ? (
              <div className="divide-y divide-white/5">
                {devices.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">🎮</span>
                      <div>
                        <p className="text-sm text-white">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${statusColor(d.status)}`}>
                      {d.status === 'available'   ? '● متاح'
                      : d.status === 'in_use'     ? '● مستخدم'
                      :                            '● صيانة'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">لا توجد أجهزة</p>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
