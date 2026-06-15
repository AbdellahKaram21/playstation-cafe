'use client'
// ============================================================
// FILE: src/app/dashboard/settings/components/SettingsForm.tsx
// ============================================================

import { useState } from 'react'
import { updateTenantSettings, updateUserProfile } from '@/app/dashboard/actions/settings'

type Props = {
  tenant: {
    name:                string
    currency:            string
    default_hourly_rate: number
    phone:               string
    address:             string
  }
  user: {
    full_name: string
    email:     string
  }
}

export default function SettingsForm({ tenant, user }: Props) {
  const [saving,      setSaving]      = useState<'tenant' | 'profile' | null>(null)
  const [tenantMsg,   setTenantMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [profileMsg,  setProfileMsg]  = useState<{ ok: boolean; text: string } | null>(null)

  // ─────────────────────────────────────────────────────────
  // حفظ إعدادات المحل
  // ─────────────────────────────────────────────────────────
  async function handleTenantSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving('tenant')
    setTenantMsg(null)

    const formData = new FormData(e.currentTarget)
    const result   = await updateTenantSettings(formData)

    setTenantMsg(result.error
      ? { ok: false, text: result.error }
      : { ok: true,  text: 'تم حفظ إعدادات المحل بنجاح ✅' }
    )
    setSaving(null)
  }

  // ─────────────────────────────────────────────────────────
  // حفظ الملف الشخصي
  // ─────────────────────────────────────────────────────────
  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving('profile')
    setProfileMsg(null)

    const formData = new FormData(e.currentTarget)
    const result   = await updateUserProfile(formData)

    setProfileMsg(result.error
      ? { ok: false, text: result.error }
      : { ok: true,  text: 'تم تحديث الاسم بنجاح ✅' }
    )
    setSaving(null)
  }

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════
          قسم 1 — إعدادات المحل
          ══════════════════════════════ */}
      <section className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">🏪 إعدادات المحل</h3>
          <p className="text-xs text-gray-500 mt-0.5">الاسم والعملة وسعر الساعة</p>
        </div>

        <form onSubmit={handleTenantSubmit} className="p-5 space-y-4">

          {/* اسم المحل */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">اسم المحل</label>
            <input
              name="name"
              defaultValue={tenant.name}
              required
              placeholder="مثال: PS Zone"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* العملة + سعر الساعة الافتراضي — جنب بعض */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">رمز العملة</label>
              <input
                name="currency"
                defaultValue={tenant.currency}
                required
                placeholder="ج"
                maxLength={5}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm placeholder-gray-600
                           focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">سعر الساعة الافتراضي</label>
              <input
                name="default_hourly_rate"
                type="number"
                min="0"
                step="0.5"
                defaultValue={tenant.default_hourly_rate}
                placeholder="0"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm placeholder-gray-600
                           focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* رقم الهاتف */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">رقم الهاتف <span className="text-gray-600">(اختياري)</span></label>
            <input
              name="phone"
              defaultValue={tenant.phone}
              placeholder="01xxxxxxxxx"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* العنوان */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">العنوان <span className="text-gray-600">(اختياري)</span></label>
            <input
              name="address"
              defaultValue={tenant.address}
              placeholder="مثال: شارع التحرير، القاهرة"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* رسالة نتيجة */}
          {tenantMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm text-right border
              ${tenantMsg.ok
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10   border-red-500/20   text-red-400'
              }`}>
              {tenantMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving === 'tenant'}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50
                       text-white text-sm font-bold rounded-xl transition-colors"
          >
            {saving === 'tenant' ? 'جاري الحفظ...' : 'حفظ إعدادات المحل'}
          </button>
        </form>
      </section>

      {/* ══════════════════════════════
          قسم 2 — الملف الشخصي
          ══════════════════════════════ */}
      <section className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">👤 الملف الشخصي</h3>
          <p className="text-xs text-gray-500 mt-0.5">اسمك وبريدك الإلكتروني</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">

          {/* الاسم */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">الاسم الكامل</label>
            <input
              name="full_name"
              defaultValue={user.full_name}
              required
              placeholder="اسمك"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* الإيميل — للعرض فقط */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-medium">
              البريد الإلكتروني <span className="text-gray-600">(لا يمكن تغييره)</span>
            </label>
            <input
              value={user.email}
              disabled
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3
                         text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* رسالة نتيجة */}
          {profileMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm text-right border
              ${profileMsg.ok
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10   border-red-500/20   text-red-400'
              }`}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving === 'profile'}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50
                       text-white text-sm font-bold rounded-xl transition-colors"
          >
            {saving === 'profile' ? 'جاري الحفظ...' : 'حفظ الملف الشخصي'}
          </button>
        </form>
      </section>

    </div>
  )
}
