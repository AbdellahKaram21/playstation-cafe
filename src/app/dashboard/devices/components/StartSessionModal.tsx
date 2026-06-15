// src/app/dashboard/devices/components/StartSessionModal.tsx
'use client'

// ✅ الـ Modal ده بيظهر لما الكاشير يضغط "ابدأ جلسة"
// بيخليه يختار: ساعة | ساعتين | Open Time

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { startSession } from '@/app/dashboard/actions/devices'

type SessionOption = {
  label: string        // النص اللي بيظهر
  type: 'open' | 'limited'
  duration_minutes: number | null
  icon: string
  description: string
}

// ✅ الخيارات الـ 3 المتاحة
const SESSION_OPTIONS: SessionOption[] = [
  {
    label: 'ساعة واحدة',
    type: 'limited',
    duration_minutes: 60,
    icon: '⏱️',
    description: '60 دقيقة  تايمر ',
  },
  {
    label: 'ساعتين',
    type: 'limited',
    duration_minutes: 120,
    icon: '⏰',
    description: '120 دقيقة - تايمر تنازلي',
  },
  {
    label: 'Open Time',
    type: 'open',
    duration_minutes: null,
    icon: '♾️',
    description: 'open - تايمر تصاعدي',
  },
]

type Props = {
  deviceId: string
  deviceName: string
  onClose: () => void
}

export default function StartSessionModal({
  deviceId,
  deviceName,
  onClose,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<SessionOption | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (!selected) return
    setIsStarting(true)
    setError(null)

    try {
      // طلب إذن Browser Notification قبل ما نبدأ
      // بنطلبه هنا لأن المستخدم عامل interaction (ضغط زرار)
      // المتصفح بيسمح بطلب الإذن بس بعد interaction
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      // ✅ استخدام Server Action بدل الكتابة المباشرة في DB
      // الـ Server Action هو اللي بيتعامل مع الـ DB بشكل آمن من السيرفر
      const result = await startSession(
        deviceId,
        selected.type,
        selected.duration_minutes ?? undefined,
      )

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
      onClose()
    } catch (err) {
      console.error(err)
      setError('حدث خطأ غير متوقع، حاول مرة أخرى')
    } finally {
      setIsStarting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div
        className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">بدء جلسة جديدة</h2>
            <p className="text-gray-400 text-xs mt-1">{deviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* الخيارات الـ 3 */}
        <div className="space-y-3 mb-6">
          {SESSION_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => setSelected(option)}
              className={`
                w-full p-4 rounded-xl border text-right transition-all duration-200
                ${selected?.label === option.label
                  ? 'border-purple-500 bg-purple-600/15 ring-1 ring-purple-500/50'
                  : 'border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{option.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{option.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  {/* دايرة الاختيار */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selected?.label === option.label
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-white/20'
                      }
                    `}
                  >
                    {selected?.label === option.label && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-right">
            ⚠️ {error}
          </div>
        )}

        {/* زرار البدء */}
        <button
          onClick={handleStart}
          disabled={!selected || isStarting}
          className="
            w-full py-4 rounded-xl font-bold text-sm transition-all duration-200
            bg-purple-600 text-white
            hover:bg-purple-500 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          {isStarting ? 'جاري البدء...' : selected ? `ابدأ ${selected.label} ▶` : 'اختر نوع الجلسة أولاً'}
        </button>
      </div>
    </div>,
    document.body
  )
}