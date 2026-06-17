'use client'
// ============================================================
// FILE: src/app/admin/tenants/[id]/TenantActions.tsx
//
// ملاحظة مهمة على الـ imports:
//   ✅ planLabel مجيوبة من plan-utils.ts (ملف client-safe)
//   ❌ مش من plans.ts (اللي بيجيب next/headers ويكسر الـ client)
// ============================================================

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { updateTenantStatus, updateSubscriptionPlan, softDeleteTenant, hardDeleteTenant, activateTenant } from '../../actions'
import { planLabel }   from '@/lib/plan-utils'

type Plan = 'free' | 'pro' | 'enterprise'

export default function TenantActions({
  tenantId,
  currentStatus,
  currentPlan,
}: {
  tenantId:      string
  currentStatus: string
  currentPlan:   string
}) {
  const router = useRouter()

  const [loadingStatus,   setLoadingStatus]   = useState(false)
  const [loadingPlan,     setLoadingPlan]     = useState(false)
  const [loadingDelete,   setLoadingDelete]   = useState(false)
  const [loadingHard,     setLoadingHard]     = useState(false)
  const [loadingActivate, setLoadingActivate] = useState(false)
  const [selectedPlan,    setSelectedPlan]    = useState<Plan>(currentPlan as Plan)

  // ── تفعيل كافيه pending ──────────────────────────────────
  async function handleActivate() {
    if (!confirm('تفعيل هذا الكافيه والسماح له بالدخول؟')) return

    setLoadingActivate(true)
    try {
      const result = await activateTenant(tenantId)
      if (result.error) { alert(result.error); return }
      router.refresh()
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingActivate(false)
    }
  }

  // ── تفعيل / تعليق ────────────────────────────────────────
  async function handleStatusToggle() {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    const msg = newStatus === 'suspended'
      ? 'هل تريد تعليق هذا الكافيه؟ المستخدمين مش هيقدروا يدخلوا.'
      : 'هل تريد تفعيل هذا الكافيه؟'
    if (!confirm(msg)) return

    setLoadingStatus(true)
    try {
      await updateTenantStatus(tenantId, newStatus)
      router.refresh()
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingStatus(false)
    }
  }

  // ── تغيير الخطة ──────────────────────────────────────────
  async function handlePlanChange() {
    if (selectedPlan === currentPlan) return
    if (!confirm(`تغيير الخطة إلى ${planLabel(selectedPlan)}؟`)) return

    setLoadingPlan(true)
    try {
      await updateSubscriptionPlan(tenantId, selectedPlan)
      router.refresh()
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingPlan(false)
    }
  }

  // ── حذف نهائي كامل ───────────────────────────────────────
  async function handleHardDelete() {
    if (!confirm('🔴 حذف نهائي كامل؟\n\nكل البيانات (جلسات، مبيعات، موظفين، auth.users) هتتمسح نهائياً والإيميل هيتحرر.')) return
    if (!confirm('⚠️ تأكيد أخير — مفيش رجعة خالص. هتكمل الحذف؟')) return

    setLoadingHard(true)
    try {
      const result = await hardDeleteTenant(tenantId)
      if (result.error) { alert(result.error); return }
      router.push('/admin/tenants')
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingHard(false)
    }
  }

  // ── حذف ──────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm('هل أنت متأكد من حذف هذا الكافيه؟')) return
    if (!confirm('⚠️ تأكيد أخير: سيتم حذف الكافيه نهائياً من القائمة.')) return

    setLoadingDelete(true)
    try {
      const result = await softDeleteTenant(tenantId)
      if (result.error) { alert(result.error); return }
      router.push('/admin/tenants')
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── زرار التفعيل — يظهر بس للـ pending ── */}
      {currentStatus === 'pending' && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
          <h3 className="text-sm font-semibold text-green-400 mb-2">طلب جديد ⏳</h3>
          <p className="text-xs text-gray-500 mb-4">
            صاحب هذا الكافيه سجّل من خلال الموقع وفي انتظار موافقتك.
          </p>
          <button
            onClick={handleActivate}
            disabled={loadingActivate}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all
                       bg-green-600/20 hover:bg-green-600/30 text-green-400
                       border border-green-500/30
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingActivate ? 'جاري التفعيل...' : '✅ تفعيل الكافيه'}
          </button>
        </div>
      )}

      {/* ── تغيير الخطة ── */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4">خطة الاشتراك</h3>
        <div className="flex gap-2 flex-wrap mb-4">
          {(['free', 'pro', 'enterprise'] as Plan[]).map(plan => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium border transition-all
                ${selectedPlan === plan
                  ? plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : plan === 'pro'        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  :                        'bg-blue-500/20   text-blue-300   border-blue-500/40'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}
              `}
            >
              {planLabel(plan)}
            </button>
          ))}
        </div>
        <button
          onClick={handlePlanChange}
          disabled={loadingPlan || selectedPlan === currentPlan}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all
                     bg-purple-600 hover:bg-purple-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingPlan ? 'جاري التحديث...' : 'تحديث الخطة'}
        </button>
      </div>

      {/* ── تفعيل / تعليق — للـ active و suspended بس ── */}
      {currentStatus !== 'pending' && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-2">حالة الكافيه</h3>
          <p className="text-xs text-gray-500 mb-4">
            {currentStatus === 'active'
              ? 'التعليق سيمنع كل المستخدمين من الدخول.'
              : 'التفعيل سيسمح للمستخدمين بالدخول مجدداً.'}
          </p>
          <button
            onClick={handleStatusToggle}
            disabled={loadingStatus}
            className={`
              w-full py-2.5 rounded-lg text-sm font-medium transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              ${currentStatus === 'active'
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30'}
            `}
          >
            {loadingStatus
              ? 'جاري التحديث...'
              : currentStatus === 'active' ? '⏸ تعليق الكافيه' : '▶ تفعيل الكافيه'}
          </button>
        </div>
      )}

      {/* ── منطقة الخطر — للـ suspended و pending بس ── */}
      {currentStatus !== 'active' && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">منطقة الخطر</h3>

          {/* Soft Delete */}
          <p className="text-xs text-gray-500 mb-3">
            إخفاء الكافيه من القائمة. البيانات التاريخية ستظل محفوظة.
          </p>
          <button
            onClick={handleDelete}
            disabled={loadingDelete}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all mb-3
                       bg-orange-600/20 hover:bg-orange-600/30 text-orange-400
                       border border-orange-500/30
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingDelete ? 'جاري الحذف...' : '🗂 إخفاء الكافيه'}
          </button>

          {/* Hard Delete */}
          <div className="border-t border-red-500/10 pt-3">
            <p className="text-xs text-gray-500 mb-3">
              حذف كامل نهائي — كل البيانات والمستخدمين والإيميلات هتتمسح نهائياً.
            </p>
            <button
              onClick={handleHardDelete}
              disabled={loadingHard}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all
                         bg-red-600/30 hover:bg-red-600/50 text-red-400
                         border border-red-500/40
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingHard ? 'جاري الحذف النهائي...' : '🗑 حذف نهائي كامل'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
