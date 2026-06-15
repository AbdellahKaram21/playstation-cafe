'use client'
// ============================================================
// FILE: src/app/dashboard/pos/components/RealtimeSync.tsx
//
// بيراقب جدولين في نفس الوقت:
//   - sessions: لما جلسة تتبدأ أو تنتهي
//   - sales:    لما منتج يتضاف أو يتعدّل أو يتحذف على جلسة
//
// أي تغيير في أي منهم → router.refresh() عشان الـ UI يتحدث
// ============================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeSync() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // channel واحد بيراقب الجدولين في نفس الوقت
    // ممكن تضيف .on() أكثر من مرة على نفس الـ channel
    const channel = supabase
      .channel('pos-sync')
      // الجلسات — بدء وإنهاء
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => router.refresh()
      )
      // المبيعات — إضافة/تعديل/حذف منتج على جلسة
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
