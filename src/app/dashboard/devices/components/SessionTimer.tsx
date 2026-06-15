'use client'
// ============================================================
// FILE: src/app/dashboard/devices/components/SessionTimer.tsx
// PURPOSE: بيعرض مدة الجلسة والسعر المتراكم في الوقت الفعلي
//
// نوعان من الجلسات:
//   'open'    → تايمر تصاعدي (الوقت بيزيد)
//   'limited' → تايمر تنازلي (الوقت بينقص لغاية ما يوصل صفر)
//
// Browser Notifications:
//   - 5 دقائق قبل الانتهاء → تحذير أول
//   - 1 دقيقة قبل الانتهاء → تحذير ثاني (أشد)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import type { SessionType } from '@/types/database.types'

type Props = {
  startTime:       string
  hourlyRate:      number
  productsTotal:   number
  type:            SessionType
  durationMinutes: number | null
}

function formatTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].filter(Boolean).join(':')
}

// ── طلب صلاحية Browser Notification ─────────────────────────
// بنطلب الصلاحية مرة واحدة بس لما الـ component يتحمل
// 'granted' = وافق | 'denied' = رفض | 'default' = لسه مسألناش
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export default function SessionTimer({
  startTime,
  hourlyRate,
  productsTotal,
  type,
  durationMinutes,
}: Props) {

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // useRef: بنحفظ فيه قيمة بدون ما نسبب re-render
  // notified5min = اتبعت تنبيه الـ 5 دقائق؟
  // notified1min = اتبعت تنبيه الـ 1 دقيقة؟
  const notified5minRef = useRef(false)
  const notified1minRef = useRef(false)

  // ── اطلب صلاحية الـ Notifications لما الـ component يتحمل ──
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      return Math.floor((Date.now() - start) / 1000)
    }

    setElapsedSeconds(calculateElapsed())

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  // ── منطق التايمر التنازلي ────────────────────────────────
  const totalSeconds     = (durationMinutes ?? 0) * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const isExpired        = type === 'limited' && remainingSeconds === 0

  // حالات التحذير
  const isWarning5min = type === 'limited' && remainingSeconds <= 300 && remainingSeconds > 60
  const isDanger1min  = type === 'limited' && remainingSeconds <= 60  && remainingSeconds > 0

  // ── Browser Notifications ─────────────────────────────────
  useEffect(() => {
    if (type !== 'limited') return  // بس للجلسات المحدودة

    const sendNotification = (title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' })
      }
    }

    // تنبيه الـ 5 دقائق
    if (isWarning5min && !notified5minRef.current) {
      notified5minRef.current = true
      sendNotification('⚠️ تحذير جلسة', 'تبقت 5 دقائق على انتهاء الجلسة!')
    }

    // تنبيه الـ 1 دقيقة
    if (isDanger1min && !notified1minRef.current) {
      notified1minRef.current = true
      sendNotification('🚨 تنبيه عاجل', 'تبقت دقيقة واحدة فقط على انتهاء الجلسة!')
    }

    // إعادة التصفير لما الجلسة تنتهي (لو بدأت جلسة جديدة لاحقاً)
    if (isExpired) {
      notified5minRef.current = false
      notified1minRef.current = false
    }
  }, [isWarning5min, isDanger1min, isExpired, type])

  // ── السعر المتراكم ───────────────────────────────────────
  const sessionCost = (elapsedSeconds / 3600) * hourlyRate
  const totalCost   = sessionCost + productsTotal

  // ── ألوان حسب الحالة ─────────────────────────────────────
  const timerColor = isExpired
    ? 'text-gray-500'
    : isDanger1min
      ? 'text-red-400'
      : isWarning5min
        ? 'text-yellow-400'
        : type === 'limited'
          ? 'text-blue-300'
          : 'text-purple-300'

  const borderColor = isExpired
    ? 'border-gray-500/20'
    : isDanger1min
      ? 'border-red-500/30'
      : isWarning5min
        ? 'border-yellow-500/30'
        : 'border-purple-500/20'

  const bgColor = isExpired
    ? 'bg-gray-500/5'
    : isDanger1min
      ? 'bg-red-500/5'
      : isWarning5min
        ? 'bg-yellow-500/5'
        : 'bg-purple-500/5'

  const displayTime = type === 'open' ? elapsedSeconds : remainingSeconds
  const timeLabel   = type === 'open' ? 'مدة الجلسة' : 'الوقت المتبقي'

  return (
    <div className={`border rounded-xl p-4 transition-colors duration-500 ${bgColor} ${borderColor}`}>

      {/* التايمر الرئيسي */}
      <div className="text-center mb-3">
        <div className={`text-3xl font-mono font-bold tracking-widest transition-colors duration-500 ${timerColor}`}>
          {isExpired ? '00:00' : formatTime(displayTime)}
        </div>
        <p className="text-xs text-gray-500 mt-1">{timeLabel}</p>
      </div>

      {/* شريط التقدم — للجلسات المحدودة فقط */}
      {type === 'limited' && durationMinutes && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isDanger1min ? 'bg-red-500' : isWarning5min ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(remainingSeconds / totalSeconds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* تحذير انتهاء الجلسة */}
      {isExpired && (
        <div className="text-center mb-3 text-xs text-gray-400 bg-gray-500/10
                        border border-gray-500/20 rounded-lg py-2">
          ⏹️ انتهت مدة الجلسة — يُرجى الإنهاء
        </div>
      )}

      {/* تحذير أقل من دقيقة */}
      {isDanger1min && (
        <div className="text-center mb-3 text-xs text-red-400 bg-red-500/10
                        border border-red-500/20 rounded-lg py-2 animate-pulse">
          🚨 أقل من دقيقة!
        </div>
      )}

      {/* تحذير أقل من 5 دقائق */}
      {isWarning5min && (
        <div className="text-center mb-3 text-xs text-yellow-400 bg-yellow-500/10
                        border border-yellow-500/20 rounded-lg py-2">
          ⚠️ تبقت أقل من 5 دقائق
        </div>
      )}

      {/* التفاصيل المالية */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>تكلفة الوقت</span>
          <span className="text-white font-medium">{sessionCost.toFixed(2)} ج</span>
        </div>

        {productsTotal > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>منتجات</span>
            <span className="text-white font-medium">{productsTotal.toFixed(2)} ج</span>
          </div>
        )}

        <div className={`flex justify-between pt-1.5 border-t ${borderColor}`}>
          <span className="text-gray-300 font-medium">الإجمالي المتوقع</span>
          <span className={`font-bold ${timerColor}`}>{totalCost.toFixed(2)} ج</span>
        </div>
      </div>

    </div>
  )
}
