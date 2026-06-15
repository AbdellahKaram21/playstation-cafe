'use client'
// ============================================================
// FILE: src/app/dashboard/staff/components/AddStaffModal.tsx
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { addStaff } from '@/app/dashboard/actions/staff'

// الأدوار المتاحة مع تفاصيلهم
const ROLES = [
  {
    value: 'cashier',
    label: 'كاشير',
    desc:  'يقدر يشغّل جلسات ويبيع منتجات',
    icon:  '🧑‍💼',
  },
  {
    value: 'admin',
    label: 'مدير',
    desc:  'كل صلاحيات الكاشير + إدارة الأجهزة والمنتجات',
    icon:  '👑',
  },
]

export default function AddStaffModal() {
  const [open,         setOpen]         = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)

  // ── Custom Dropdown state ────────────────────────────────
  const [selectedRole,    setSelectedRole]    = useState('cashier')
  const [dropdownOpen,    setDropdownOpen]    = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // لما المستخدم يضغط برّا الـ dropdown، يقفله
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    // نضيف الـ role اللي اختاره المستخدم من الـ custom dropdown
    formData.set('role', selectedRole)

    const result = await addStaff(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedRole('cashier')
      }, 1500)
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setError(null)
    setSuccess(false)
    setSelectedRole('cashier')
    setDropdownOpen(false)
  }

  // الـ role اللي متاختاره دلوقتي
  const currentRole = ROLES.find(r => r.value === selectedRole) ?? ROLES[0]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500
                   text-white text-sm font-medium rounded-xl transition-colors"
      >
        <span>+</span>
        <span>إضافة موظف</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70" onClick={handleClose} />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0d0d14] border border-white/10
                            rounded-2xl shadow-2xl" dir="rtl">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">إضافة موظف جديد</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white text-xl transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {success ? (
                  <div className="py-8 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-white text-sm font-medium">تم إضافة الموظف بنجاح!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* الاسم الكامل */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">الاسم الكامل</label>
                      <input
                        name="full_name"
                        required
                        placeholder="أحمد محمد"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                                   text-white text-sm placeholder-gray-600
                                   focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>

                    {/* اسم المستخدم */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">
                        اسم المستخدم
                        <span className="text-gray-600 font-normal mr-1">(بيستخدمه للدخول بدل الإيميل)</span>
                      </label>
                      <input
                        name="username"
                        required
                        placeholder="ahmed_cashier"
                        dir="ltr"
                        pattern="[a-z0-9_]+"
                        title="حروف إنجليزية صغيرة وأرقام و _ فقط"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                                   text-white text-sm placeholder-gray-600
                                   focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                      <p className="text-gray-600 text-[11px]">حروف إنجليزية صغيرة، أرقام، أو _ فقط</p>
                    </div>

                    {/* الإيميل */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">
                        البريد الإلكتروني
                        <span className="text-gray-600 font-normal mr-1">(داخلي — مش بيظهر للموظف)</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="ahmed@yourcafe.com"
                        dir="ltr"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                                   text-white text-sm placeholder-gray-600
                                   focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>

                    {/* كلمة السر */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">كلمة السر</label>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        placeholder="8 أحرف على الأقل"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                                   text-white text-sm placeholder-gray-600
                                   focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>

                    {/* ── الدور الوظيفي — Custom Dropdown ─────────── */}
                    {/*
                      ليه Custom Dropdown بدل <select>؟
                      الـ <select> الـ options بتاعته بتتلوّن بلون نظام التشغيل
                      على Windows بيجيب background أبيض أو رمادي فاتح
                      وده بيخلي النص مش واضح على الـ dark theme بتاعنا
                      الحل: نبني dropdown بـ div عادي ونتحكم في الشكل بالكامل
                    */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">الدور الوظيفي</label>

                      {/* الـ ref بيساعدنا نكتشف لو المستخدم ضغط برّا */}
                      <div className="relative" ref={dropdownRef}>

                        {/* زرار فتح الـ dropdown — بيشبه شكل الـ select */}
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(prev => !prev)}
                          className="w-full flex items-center justify-between
                                     bg-black/30 border border-white/10 rounded-xl px-4 py-3
                                     text-white text-sm transition-colors
                                     hover:border-white/20 focus:outline-none focus:border-purple-500/50"
                        >
                          {/* الاختيار الحالي */}
                          <div className="flex items-center gap-2">
                            <span>{currentRole.icon}</span>
                            <span>{currentRole.label}</span>
                            <span className="text-gray-500 text-xs">— {currentRole.desc}</span>
                          </div>
                          {/* سهم يتحرك لما الـ dropdown يفتح */}
                          <span className={`text-gray-400 text-xs transition-transform duration-200
                                           ${dropdownOpen ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {/* قائمة الخيارات — بتظهر بس لو dropdownOpen = true */}
                        {dropdownOpen && (
                          <div className="absolute top-full mt-1 w-full z-10
                                          bg-[#0d0d14] border border-white/10 rounded-xl
                                          overflow-hidden shadow-xl">
                            {ROLES.map(role => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => {
                                  setSelectedRole(role.value)
                                  setDropdownOpen(false)
                                }}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-3 text-right
                                  transition-colors
                                  ${selectedRole === role.value
                                    ? 'bg-purple-600/20 text-white'
                                    : 'text-gray-300 hover:bg-white/5'}
                                `}
                              >
                                <span className="text-base">{role.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{role.label}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{role.desc}</p>
                                </div>
                                {/* علامة الاختيار */}
                                {selectedRole === role.value && (
                                  <span className="text-purple-400 text-sm">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* خطأ */}
                    {error && (
                      <div className="px-4 py-3 rounded-xl text-sm text-right border
                                      bg-red-500/10 border-red-500/20 text-red-400">
                        {error}
                      </div>
                    )}

                    {/* أزرار */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500
                                   disabled:opacity-50 text-white text-sm font-bold
                                   rounded-xl transition-colors"
                      >
                        {loading ? 'جاري الإضافة...' : 'إضافة الموظف'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-3 border border-white/10 text-gray-400
                                   hover:text-white rounded-xl text-sm transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>

                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
