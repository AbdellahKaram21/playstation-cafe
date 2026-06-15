'use client'
// ============================================================
// FILE: src/app/dashboard/upgrade/components/UpgradeButton.tsx
// PURPOSE: زرار الترقية — بيبعت طلب للـ DB ومش بيغير الخطة فوراً
// ============================================================

import { useState } from 'react'
import { requestUpgrade } from '../actions'

type Props = {
  planName: string
  planId:   string
  type:     'upgrade' | 'downgrade'
}

export default function UpgradeButton({ planName, planId, type }: Props) {
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleClick() {
    setStatus('loading')
    setMessage('')

    const result = await requestUpgrade(planId)

    if (result.error) {
      setStatus('error')
      setMessage(result.error)
    } else {
      setStatus('success')
      setMessage('تم إرسال طلبك! سيتم مراجعته والترقية في أقرب وقت.')
    }
  }

  // بعد ما بعت الطلب بنجاح
  if (status === 'success') {
    return (
      <div className="space-y-2">
        <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20
                        text-center text-xs text-green-400 font-medium">
          ✅ الطلب قيد المراجعة
        </div>
        <p className="text-[10px] text-gray-500 text-center leading-relaxed">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className={`w-full py-2.5 rounded-xl text-xs font-bold
                   disabled:opacity-60 text-white transition-colors cursor-pointer
                   ${type === 'downgrade'
                     ? 'bg-gray-600 hover:bg-gray-500'
                     : 'bg-purple-600 hover:bg-purple-500'
                   }`}
      >
        {status === 'loading'
          ? 'جاري الإرسال...'
          : type === 'downgrade'
            ? `طلب التخفيض إلى ${planName}`
            : `طلب الترقية إلى ${planName}`
        }
      </button>

      {/* رسالة خطأ */}
      {status === 'error' && (
        <p className="text-[10px] text-red-400 text-center">{message}</p>
      )}

      {/* تنبيه صغير */}
      {status === 'idle' && (
        <p className="text-[10px] text-gray-600 text-center">
          {type === 'downgrade'
            ? 'سيتم تخفيض الخطة بعد موافقة الإدارة'
            : 'سيتم تفعيل الخطة بعد المراجعة'
          }
        </p>
      )}
    </div>
  )
}
