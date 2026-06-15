// ============================================================
// FILE: src/app/admin/upgrade-requests/page.tsx
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser }           from '@/app/actions/auth'
import { redirect }          from 'next/navigation'
import { planLabel }         from '@/lib/plans'
import UpgradeRequestActions from './components/UpgradeRequestActions'

// ── دالة مساعدة لتحويل الـ tenants بأمان ──
function toTenant(raw: unknown): { id: string; name: string; plan: string } | null {
  if (!raw) return null
  // إذا كانت tenants قادمة كـ Array نأخذ العنصر الأول، وإلا نأخذها مباشرة
  const obj = Array.isArray(raw) ? raw[0] : raw
  if (!obj || typeof obj !== 'object') return null
  return obj as { id: string; name: string; plan: string }
}

export default async function UpgradeRequestsPage() {
  const user = await getUser()
  if (user?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: requests } = await admin
    .from('upgrade_requests')
    .select(`
      id, from_plan, to_plan, status, notes, created_at, updated_at,
      tenants ( id, name, plan )
    `)
    .order('created_at', { ascending: false })

  const pending  = (requests ?? []).filter(r => r.status === 'pending')
  const resolved = (requests ?? []).filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">

      <div>
        <h2 className="text-lg font-bold text-white">طلبات الترقية</h2>
        <p className="text-sm text-gray-400 mt-0.5">{pending.length} طلب معلق</p>
      </div>

      {/* الطلبات المعلقة */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center gap-2">
          <span className="text-yellow-400">⏳</span>
          <h3 className="text-sm font-semibold text-yellow-300">
            قيد المراجعة ({pending.length})
          </h3>
        </div>

        {pending.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-gray-400">لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <div className="divide-y divide-yellow-500/10">
            {pending.map(req => {
              const tenant = toTenant(req.tenants)
              return (
                <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{tenant?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      من{' '}
                      <span className="text-gray-300">{planLabel(req.from_plan)}</span>
                      {' → '}
                      <span className="text-purple-300 font-semibold">{planLabel(req.to_plan)}</span>
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {new Date(req.created_at).toLocaleDateString('ar-EG', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <UpgradeRequestActions requestId={req.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* السجل */}
      {resolved.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">السجل ({resolved.length})</h3>
          </div>
          <div className="divide-y divide-white/5">
            {resolved.map(req => {
              const tenant = toTenant(req.tenants)
              return (
                <div key={req.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium text-white">{tenant?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {planLabel(req.from_plan)} → {planLabel(req.to_plan)}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0
                    ${req.status === 'approved'
                      ? 'bg-green-500/15 text-green-400 border-green-500/20'
                      : 'bg-red-500/15   text-red-400   border-red-500/20'
                    }`}>
                    {req.status === 'approved' ? '✅ تمت الموافقة' : '❌ مرفوض'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}