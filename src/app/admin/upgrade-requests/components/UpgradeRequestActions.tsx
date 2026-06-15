'use client'
// ============================================================
// FILE: src/app/admin/upgrade-requests/components/UpgradeRequestActions.tsx
// PURPOSE: أزراير Approve/Reject — Client Component
// ============================================================

import { useState } from 'react'
import { approveUpgrade, rejectUpgrade } from '@/app/dashboard/upgrade/actions'
import { useRouter } from 'next/navigation'

type Props = { requestId: string }

export default function UpgradeRequestActions({ requestId }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done,    setDone]    = useState<'approved' | 'rejected' | null>(null)
  const router = useRouter()

  async function handleApprove() {
    setLoading('approve')
    const result = await approveUpgrade(requestId)
    if (result.success) {
      setDone('approved')
      router.refresh()
    }
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    const result = await rejectUpgrade(requestId)
    if (result.success) {
      setDone('rejected')
      router.refresh()
    }
    setLoading(null)
  }

  if (done === 'approved') {
    return (
      <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
        ✅ تمت الموافقة
      </span>
    )
  }

  if (done === 'rejected') {
    return (
      <span className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 font-medium">
        ❌ مرفوض
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleApprove}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 rounded-lg font-bold
                   bg-green-600 hover:bg-green-500 disabled:opacity-50
                   text-white transition-colors"
      >
        {loading === 'approve' ? '...' : 'موافقة ✅'}
      </button>
      <button
        onClick={handleReject}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 rounded-lg font-bold
                   bg-red-600/80 hover:bg-red-600 disabled:opacity-50
                   text-white transition-colors"
      >
        {loading === 'reject' ? '...' : 'رفض ❌'}
      </button>
    </div>
  )
}
