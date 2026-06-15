// ============================================================
// FILE: src/app/dashboard/devices/page.tsx
// ============================================================

import { createClient } from '@/lib/supabase/server'
import DeviceCard      from './components/DeviceCard'
import AddDeviceModal  from './components/AddDeviceModal'

export default async function DevicesPage() {
  const supabase = await createClient()

  // نجيب الـ role عشان نمرره للـ components
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role          = profile?.role ?? 'cashier'
  const canManage     = role === 'owner' || role === 'admin' || role === 'super_admin'

  const { data: devices } = await supabase
    .from('devices')
    .select(`
      *,
      sessions ( id, start_time, hourly_rate, products_total, status, type, duration_minutes )
    `)
    .eq('is_deleted' as any, false)
    .order('created_at', { ascending: true })

  const devicesWithActiveSession = devices?.map(device => ({
    ...device,
    activeSession: (device.sessions as any[])?.find(
      (s: any) => s.status === 'active'
    ) ?? null,
  })) ?? []

  const total       = devicesWithActiveSession.length
  const inUse       = devicesWithActiveSession.filter(d => d.status === 'in_use').length
  const available   = devicesWithActiveSession.filter(d => d.status === 'available').length
  const maintenance = devicesWithActiveSession.filter(d => d.status === 'maintenance').length

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl pt-10 lg:pt-0" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            {canManage ? 'إدارة الأجهزة' : 'الأجهزة'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} جهاز — {inUse} شغال، {available} متاح
            {maintenance > 0 && `، ${maintenance} صيانة`}
          </p>
        </div>
        {/* زرار إضافة جهاز — يظهر بس للـ owner وadmin */}
        {canManage && <AddDeviceModal />}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'متاحة',  count: available,  color: 'green'  },
          { label: 'مشغولة', count: inUse,       color: 'purple' },
          { label: 'صيانة',  count: maintenance, color: 'yellow' },
        ].map(item => (
          <div key={item.label} className={`
            rounded-xl border p-3 md:p-4 text-center
            ${item.color === 'green'  ? 'border-green-500/20  bg-green-500/5'  : ''}
            ${item.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' : ''}
            ${item.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' : ''}
          `}>
            <p className={`text-xl md:text-2xl font-bold
              ${item.color === 'green'  ? 'text-green-400'  : ''}
              ${item.color === 'purple' ? 'text-purple-400' : ''}
              ${item.color === 'yellow' ? 'text-yellow-400' : ''}
            `}>{item.count}</p>
            <p className="text-xs text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Devices Grid */}
      {devicesWithActiveSession.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] py-16 text-center">
          <div className="text-5xl mb-3">🎮</div>
          <p className="text-sm text-gray-400">لا توجد أجهزة بعد</p>
          {canManage && (
            <p className="text-xs text-gray-600 mt-1">اضغط "إضافة جهاز" للبدء</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {devicesWithActiveSession.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              activeSession={device.activeSession}
              canManage={canManage}
            />
          ))}
        </div>
      )}

    </div>
  )
}
