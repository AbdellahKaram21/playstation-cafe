'use client'
// ============================================================
// FILE: src/app/admin/components/CronRunner.tsx
//
// زرار "تشغيل يدوي" للـ Cron Job — في صفحة الـ Admin فقط
//
// ليه Client Component؟
//   لأن فيه onClick + useState + fetch — ده كله browser stuff
//   مش بيتشغّل على الـ server
// ============================================================

import { useState } from 'react'

type CronResult = {
  success: boolean
  count:   number
  run_at:  string
  error?:  string
}

export function CronRunner() {
  // حالة الـ loading والنتيجة
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState<CronResult | null>(null)
  const [error,   setError]     = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // نضرب الـ API endpoint بنفس الطريقة اللي Vercel بيضربه
      // CRON_SECRET موجود في .env.local — لكن هنا في الـ client مش هينفع نقرأه!
      // الحل: نعمل route جديد /api/admin/run-cron يشيك على session بدل الـ secret
      const res = await fetch('/api/admin/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حصل خطأ غير معروف')
        return
      }

      setResult(data)
    } catch {
      setError('تعذّر الاتصال بالـ server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Cron Job — إيقاف الاشتراكات المنتهية</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              بيشتغل تلقائياً كل يوم الساعة 4 صباحاً (Cairo) — أو شغّله يدوياً من هنا
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
          ✅ مفعّل
        </span>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span>🕐 كل يوم 2:00 AM UTC</span>
        <span>🗄️ pg_cron في Supabase</span>
        <span>☁️ Vercel Cron (backup)</span>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-all duration-150
          ${loading
            ? 'bg-orange-500/10 text-orange-300/50 cursor-not-allowed'
            : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30'
          }
        `}
      >
        {loading ? (
          <>
            {/* Spinner بسيط */}
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            جاري التشغيل...
          </>
        ) : (
          <>▶ تشغيل الآن</>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400 font-medium mb-1">
            ✅ تمّ بنجاح
          </p>
          <p className="text-xs text-gray-400">
            {result.count > 0
              ? `تم إيقاف ${result.count} كافيه منتهي الاشتراك`
              : 'لا توجد اشتراكات منتهية — كل حاجة تمام'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(result.run_at).toLocaleString('ar-EG')}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-medium mb-1">❌ فشل التشغيل</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      )}
    </div>
  )
}
