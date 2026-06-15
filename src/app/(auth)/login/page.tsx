'use client'
// ============================================================
// FILE: src/app/(auth)/login/page.tsx
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error,   setError]   = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result   = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold text-white">PS Cafe Manager</h1>
          <p className="text-gray-400 mt-1 text-sm">سجّل دخولك لإدارة الكافيه</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400
                            rounded-lg p-3 mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">

            {/* Identifier — username أو email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <input
                name="identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="ahmed_cashier أو example@cafe.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg
                           px-4 py-2.5 text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:border-purple-500 focus:ring-1
                           focus:ring-purple-500 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1.5">
                الموظفون: اكتب اسم المستخدم — أصحاب الكافيهات: اكتب الإيميل
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                كلمة السر
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg
                           px-4 py-2.5 text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:border-purple-500 focus:ring-1
                           focus:ring-purple-500 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800
                         disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg
                         transition-colors text-sm mt-2"
            >
              {loading ? '...' : 'تسجيل الدخول'}
            </button>

          </form>

          {/* Register Link */}
          <p className="text-center text-gray-500 text-sm mt-6">
            مش عندك كافيه؟{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300">
              سجّل كافيهك دلوقتي
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
