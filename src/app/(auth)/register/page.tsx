'use client'
// ============================================================
// FILE: src/app/(auth)/register/page.tsx
// URL:  /register
//
// نظام التسجيل: Email + Password (بدل OTP)
// مرحلتين فقط:
//   1. بيانات الكافيه + الإيميل + كلمة السر
//   2. شاشة الانتظار pending
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { registerWithPassword } from '@/app/actions/auth'

// ── مكون مشترك للـ Input ─────────────────────────────────────
// بدل ما نكرر نفس الكود لكل حقل، عملنا مكون واحد قابل لإعادة الاستخدام
function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  optional = false,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}
        {optional && <span className="text-gray-600 text-xs mr-1">(اختياري)</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg
                   px-4 py-2.5 text-white placeholder-gray-500 text-sm
                   focus:outline-none focus:border-purple-500 transition-colors"
      />
    </div>
  )
}

export default function RegisterPage() {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // التحقق من تطابق كلمتي السر قبل الإرسال (في الـ client)
    const password = formData.get('password') as string
    const confirm  = formData.get('confirm_password') as string

    if (password !== confirm) {
      setError('كلمتا السر غير متطابقتين')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('كلمة السر لازم تكون 8 حروف على الأقل')
      setLoading(false)
      return
    }

    // نرسل البيانات للـ Server Action
    const result = await registerWithPassword(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    // نجحت العملية → نحفظ الإيميل ونعرض شاشة الانتظار
    setEmail(formData.get('email') as string)
    setDone(true)
  }

  // ── شاشة الانتظار بعد التسجيل الناجح ────────────────────
  if (done) {
    return (
      <div
        className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-white mb-3">تم استلام طلبك!</h2>
          <p className="text-gray-400 text-sm mb-2">
            هنراجع بياناتك وهنتواصل معاك على
          </p>
          <p className="text-purple-400 font-medium mb-6">{email}</p>
          <p className="text-gray-500 text-xs">عادةً بيتم التفعيل خلال 24 ساعة</p>
        </div>
      </div>
    )
  }

  // ── فورم التسجيل ─────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🕹️</div>
          <h1 className="text-2xl font-bold text-white">سجّل كافيهك</h1>
          <p className="text-gray-400 mt-1 text-sm">أنشئ حسابك وابدأ إدارة كافيهك</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400
                            rounded-lg p-3 mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── بيانات الكافيه ── */}
            <p className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 pb-2">
              بيانات الكافيه
            </p>

            <Field
              label="اسم الكافيه"
              name="cafe_name"
              placeholder="مثال: ستارز كافيه"
              required
            />
            <Field
              label="عنوان الكافيه"
              name="address"
              placeholder="المعادي، القاهرة"
              optional
            />

            {/* ── بياناتك الشخصية ── */}
            <p className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
              بياناتك الشخصية
            </p>

            <Field
              label="اسمك الكامل"
              name="full_name"
              placeholder="أحمد محمد"
              required
            />
            <Field
              label="رقم التليفون"
              name="phone"
              type="tel"
              placeholder="01xxxxxxxxx"
              optional
            />
            <Field
              label="البريد الإلكتروني"
              name="email"
              type="email"
              placeholder="owner@cafe.com"
              required
            />

            {/* ── كلمة السر ── */}
            <p className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 pb-2 pt-2">
              كلمة السر
            </p>

            <Field
              label="كلمة السر"
              name="password"
              type="password"
              placeholder="8 حروف على الأقل"
              required
            />
            <Field
              label="تأكيد كلمة السر"
              name="confirm_password"
              type="password"
              placeholder="أعد كتابة كلمة السر"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800
                         disabled:cursor-not-allowed text-white font-medium py-2.5
                         rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'جاري الإنشاء...' : 'إرسال الطلب ✓'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            عندك حساب؟{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              سجّل دخولك
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
