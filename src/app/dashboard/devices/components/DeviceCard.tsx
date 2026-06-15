'use client'
// ============================================================
// FILE: src/app/dashboard/devices/components/DeviceCard.tsx
// ============================================================

import { useState }      from 'react'
import { endSession, updateDevice } from '../../actions/devices'
import SessionTimer      from './SessionTimer'
import EditDeviceModal   from './EditDeviceModal'
import StartSessionModal from './StartSessionModal'
import type { Device, Session } from '@/types/database.types'

type Props = {
  device:        Device
  activeSession: Pick<Session, 'id' | 'start_time' | 'hourly_rate' | 'products_total' | 'type' | 'duration_minutes'> | null
  canManage:     boolean   // ← true = owner/admin | false = cashier
}

const deviceIcons: Record<string, string> = {
  PS5:  '🎮',
  PS4:  '🕹️',
  PC:   '💻',
  VR:   '🥽',
  Ping: '🏓',
}

const statusConfig = {
  available:   { label: 'متاح',  color: 'text-green-400',  bg: 'bg-green-500/10  border-green-500/20'  },
  in_use:      { label: 'مشغول', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  maintenance: { label: 'صيانة', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
}

export default function DeviceCard({ device, activeSession, canManage }: Props) {
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)

  const status = statusConfig[device.status as keyof typeof statusConfig]

  async function handleEnd() {
    if (!activeSession) return
    setLoading(true)
    setError('')
    const result = await endSession(activeSession.id)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  async function handleStatusChange(newStatus: Device['status']) {
    setLoading(true)
    setShowStatusMenu(false)
    await updateDevice(device.id, { status: newStatus })
    setLoading(false)
  }

  return (
    <div className={`
      rounded-xl border p-5 flex flex-col gap-4 relative
      bg-[#0d0d14] transition-all duration-200
      ${device.status === 'in_use'
        ? 'border-purple-500/30 shadow-lg shadow-purple-500/5'
        : 'border-white/5 hover:border-white/10'
      }
    `}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">
          <div className={`
            w-11 h-11 rounded-xl flex items-center justify-center text-2xl
            ${device.status === 'in_use' ? 'bg-purple-600/20' : 'bg-white/5'}
          `}>
            {deviceIcons[device.type] ?? '🎮'}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{device.name}</h3>
            <p className="text-xs text-gray-500">{device.type} • {device.hourly_rate} ج/ساعة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* زرار التعديل — يظهر فقط لـ owner/admin، ولو الجهاز مش شغال */}
          {canManage && device.status !== 'in_use' && (
            <EditDeviceModal device={device} />
          )}

          {/* Status Badge
              - لو canManage: يقدر يضغط عليه ويغيّر الحالة
              - لو كاشير: badge بس للعرض، مش قابل للضغط
          */}
          <div className="relative">
            <button
              onClick={() => canManage && device.status !== 'in_use' && setShowStatusMenu(!showStatusMenu)}
              className={`
                text-xs px-2.5 py-1 rounded-full border font-medium
                ${status.bg} ${status.color}
                ${canManage && device.status !== 'in_use'
                  ? 'cursor-pointer hover:opacity-80'
                  : 'cursor-default'}
              `}
            >
              {status.label}
            </button>

            {/* قائمة تغيير الحالة — للـ owner/admin بس */}
            {showStatusMenu && canManage && (
              <div className="absolute left-0 top-8 z-10 bg-[#1a1a2e] border border-white/10
                              rounded-lg shadow-xl overflow-hidden min-w-32">
                {(['available', 'maintenance'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full text-right px-3 py-2 text-xs text-gray-300
                               hover:bg-white/5 transition-colors"
                  >
                    {statusConfig[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── TIMER ───────────────────────────────────────────── */}
      {activeSession && device.status === 'in_use' && (
        <SessionTimer
          startTime={activeSession.start_time}
          hourlyRate={activeSession.hourly_rate}
          productsTotal={activeSession.products_total ?? 0}
          type={activeSession.type}
          durationMinutes={activeSession.duration_minutes ?? null}
        />
      )}

      {/* ── ERROR ───────────────────────────────────────────── */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                      rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── ACTION BUTTON ───────────────────────────────────── */}
      {/* بدء جلسة — الكاشير يقدر */}
      {device.status === 'available' && (
        <button
          onClick={() => setShowStartModal(true)}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800
                     disabled:cursor-not-allowed text-white text-sm font-medium
                     py-2.5 rounded-lg transition-colors"
        >
          ▶ بدء جلسة
        </button>
      )}

      {/* إنهاء جلسة — الكاشير يقدر */}
      {device.status === 'in_use' && activeSession && (
        <button
          onClick={handleEnd}
          disabled={loading}
          className="w-full bg-red-600/80 hover:bg-red-500 disabled:bg-red-900
                     disabled:cursor-not-allowed text-white text-sm font-medium
                     py-2.5 rounded-lg transition-colors"
        >
          {loading ? '...' : '■ إنهاء الجلسة'}
        </button>
      )}

      {device.status === 'maintenance' && (
        <div className="w-full text-center text-xs text-yellow-400/70 py-2">
          🔧 الجهاز تحت الصيانة
        </div>
      )}

      {/* ── START SESSION MODAL ─────────────────────────────── */}
      {showStartModal && (
        <StartSessionModal
          deviceId={device.id}
          deviceName={device.name}
          onClose={() => setShowStartModal(false)}
        />
      )}

    </div>
  )
}
