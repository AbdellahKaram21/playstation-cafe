'use client'
// ============================================================
// FILE: src/app/dashboard/components/NotificationCenter.tsx
// PURPOSE: Bell icon في الـ Header + Dropdown بقائمة التنبيهات
//
// ليه Client Component؟
//   - بيستخدم useState لفتح/غلق الـ dropdown
//   - بيستخدم useEffect لغلق الـ dropdown لو ضغط برّه
//
// البيانات (notifications) بتيجي من الـ Server (DashboardHeader)
// وبتتمرر كـ props — مش بنعمل fetch هنا
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { AppNotification } from '@/lib/notifications'

type Props = {
  notifications: AppNotification[]
}

// ── أيقونة وألوان كل نوع تنبيه ──────────────────────────────
const severityConfig = {
  error: {
    icon:      '🔴',
    dot:       'bg-red-500',
    badge:     'bg-red-500',
    itemBorder:'border-red-500/20',
    itemBg:    'bg-red-500/5',
    text:      'text-red-400',
  },
  warning: {
    icon:      '🟡',
    dot:       'bg-yellow-500',
    badge:     'bg-yellow-500',
    itemBorder:'border-yellow-500/20',
    itemBg:    'bg-yellow-500/5',
    text:      'text-yellow-400',
  },
  info: {
    icon:      '🔵',
    dot:       'bg-blue-500',
    badge:     'bg-blue-500',
    itemBorder:'border-blue-500/20',
    itemBg:    'bg-blue-500/5',
    text:      'text-blue-400',
  },
}

// أيقونة التنبيه حسب النوع
const typeIcon: Record<AppNotification['type'], string> = {
  low_stock:    '📦',
  out_of_stock: '🚫',
  sub_expiry:   '💳',
}

export default function NotificationCenter({ notifications }: Props) {
  const [open, setOpen] = useState(false)

  // useRef: بنمسك مرجع لعنصر الـ dropdown
  // عشان نعرف لو الضغطة كانت جوّاه ولا بره
  const containerRef = useRef<HTMLDivElement>(null)

  const errorCount   = notifications.filter(n => n.severity === 'error').length
  const warningCount = notifications.filter(n => n.severity === 'warning').length

  // العدد اللي يظهر على الـ badge
  // بنحط الأخطاء الأهم — لو في errors هنعرض عددهم
  const badgeCount = notifications.length

  // ── إغلاق الـ dropdown لو ضغط برّه ─────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // containerRef.current هو الـ div الكبير اللي بيلف كل حاجة
      // لو الضغطة مش جوّاه → اغلق الـ dropdown
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      // addEventListener: بنستمع لأي ضغطة على الصفحة
      document.addEventListener('mousedown', handleClickOutside)
    }

    // cleanup: لما الـ component يتمسح أو open تتغير
    // بنشيل الـ listener عشان ما يحصلش memory leak
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    // div الـ wrapper — relative عشان الـ dropdown يتموضع جوّاه
    <div className="relative" ref={containerRef}>

      {/* ── زرار Bell ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10
                   flex items-center justify-center text-gray-400
                   hover:text-white hover:bg-white/10 transition-all duration-150"
        aria-label="التنبيهات"
      >
        {/* أيقونة الجرس */}
        <span className="text-base">🔔</span>

        {/* Badge العدد — يظهر بس لو في تنبيهات */}
        {badgeCount > 0 && (
          <span className={`
            absolute -top-1 -left-1 min-w-[18px] h-[18px] rounded-full
            flex items-center justify-center text-[10px] font-bold text-white
            ${errorCount > 0 ? 'bg-red-500' : 'bg-yellow-500'}
          `}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────────────── */}
      {open && (
        <div className="
          absolute left-0 top-12 z-50
          w-80 max-h-96 overflow-y-auto
          bg-[#0d0d14] border border-white/10
          rounded-xl shadow-2xl shadow-black/50
        ">

          {/* Header الـ dropdown */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">التنبيهات</h3>
            <div className="flex items-center gap-2">
              {/* ملخص سريع */}
              {errorCount > 0 && (
                <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20
                                 px-2 py-0.5 rounded-full">
                  {errorCount} خطأ
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20
                                 px-2 py-0.5 rounded-full">
                  {warningCount} تحذير
                </span>
              )}
            </div>
          </div>

          {/* قائمة التنبيهات */}
          {notifications.length === 0 ? (

            // حالة فارغة
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-400">كل حاجة تمام!</p>
              <p className="text-xs text-gray-600 mt-1">مفيش تنبيهات دلوقتي</p>
            </div>

          ) : (
            <div className="p-2 space-y-1.5">
              {notifications.map(notification => {
                const config = severityConfig[notification.severity]
                return (
                  // كل تنبيه هو Link — لو ضغط عليه يروح للصفحة المناسبة
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => setOpen(false)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border
                      transition-all duration-150
                      hover:opacity-80 cursor-pointer
                      ${config.itemBg} ${config.itemBorder}
                    `}
                  >
                    {/* أيقونة النوع */}
                    <span className="text-lg shrink-0 mt-0.5">
                      {typeIcon[notification.type]}
                    </span>

                    {/* النص */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${config.text}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* نقطة اللون */}
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${config.dot}`} />
                  </Link>
                )
              })}
            </div>
          )}

          {/* Footer — رابط للإعدادات */}
          {notifications.some(n => n.type === 'sub_expiry') && (
            <div className="px-4 py-3 border-t border-white/5">
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                ← الذهاب للإعدادات
              </Link>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
