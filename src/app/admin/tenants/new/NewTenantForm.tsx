'use client'
// ============================================================
// FILE: src/app/admin/tenants/new/NewTenantForm.tsx
// PURPOSE: فورم إضافة كافيه جديد — Client Component
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTenant } from '../../actions'  // ✅ الـ path الصح — ارجع مجلدين لـ /admin/actions.ts

// القيمة في DB لسه 'free' — بس في الـ UI بنعرضها كـ 'Normal'
type Plan = 'free' | 'pro' | 'enterprise'

const PLANS: { value: Plan; label: string; desc: string; color: string }[] = [
  {
    value: 'free',
    label: 'Normal',
    desc:  '10 أجهزة و5 موظفين — للكافيهات العادية',
    color: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
  },
  {
    value: 'pro',
    label: '💜 Pro',
    desc:  '25 جهاز و15 موظف — للكافيهات المتوسطة',
    color: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
  },
  {
    value: 'enterprise',
    label: '⭐ Enterprise',
    desc:  'عدد غير محدود — للسلاسل الكبيرة',
    color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
  },
]

export default function NewTenantForm() {
  const router = useRouter()

  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan>('free')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('plan', selectedPlan)

      const result = await createTenant(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(`/admin/tenants/${result.tenantId}`)
    } catch {
      setError('حدث خطأ غير متوقع، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* اسم الكافيه */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          اسم الكافيه <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="مثال: ستارز كافيه"
          className="w-full bg-white/5 border border-white/10 rounded-xl
                     px-4 py-2.5 text-sm text-white placeholder-gray-500
                     focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07]
                     transition-all"
        />
      </div>

      {/* رقم التليفون */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          رقم التليفون
          <span className="text-gray-500 text-xs font-normal mr-2">(اختياري)</span>
        </label>
        <input
          type="tel"
          name="phone"
          placeholder="مثال: 01012345678"
          className="w-full bg-white/5 border border-white/10 rounded-xl
                     px-4 py-2.5 text-sm text-white placeholder-gray-500
                     focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07]
                     transition-all"
        />
      </div>

      {/* العنوان */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          العنوان
          <span className="text-gray-500 text-xs font-normal mr-2">(اختياري)</span>
        </label>
        <input
          type="text"
          name="address"
          placeholder="مثال: المعادي، القاهرة"
          className="w-full bg-white/5 border border-white/10 rounded-xl
                     px-4 py-2.5 text-sm text-white placeholder-gray-500
                     focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07]
                     transition-all"
        />
      </div>

      {/* خطة الاشتراك */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          خطة الاشتراك
        </label>
        <div className="space-y-2">
          {PLANS.map(plan => (
            <button
              key={plan.value}
              type="button"
              onClick={() => setSelectedPlan(plan.value)}
              className={`
                w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-right
                ${selectedPlan === plan.value
                  ? plan.color + ' border-opacity-60'
                  : 'border-white/5 bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]'}
              `}
            >
              <div className={`
                w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                ${selectedPlan === plan.value ? 'border-current' : 'border-gray-600'}
              `}>
                {selectedPlan === plan.value && (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-medium">{plan.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* أزرار */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/admin/tenants"
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center
                     border border-white/10 text-gray-400
                     hover:bg-white/5 hover:text-gray-300 transition-all"
        >
          إلغاء
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium
                     bg-purple-600 hover:bg-purple-700 text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء الكافيه ✓'}
        </button>
      </div>

    </form>
  )
}
