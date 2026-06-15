'use client'
// ============================================================
// FILE: src/app/dashboard/staff/components/StaffList.tsx
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { updateStaffRole, deleteStaff, updateStaffPassword } from '@/app/dashboard/actions/staff'

type StaffMember = {
  id:         string
  full_name:  string | null
  email:      string
  username:   string | null
  role:       string
  created_at: string
}

type Props = {
  staffList: StaffMember[]
}

// ── RoleDropdown ─────────────────────────────────────────────
function RoleDropdown({
  staffId,
  currentRole,
  disabled,
  onChange,
}: {
  staffId:     string
  currentRole: string
  disabled:    boolean
  onChange:    (id: string, role: 'admin' | 'cashier') => void
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  const roles = [
    { value: 'cashier', label: 'كاشير' },
    { value: 'admin',   label: 'مدير'  },
  ]
  const current = roles.find(r => r.value === currentRole) ?? roles[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    // position: relative على الـ wrapper عشان الـ dropdown يتحسب منه
    <div ref={ref} className="relative">

      {/* الزرار */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                   bg-white/5 border border-white/10 text-white min-w-[80px]
                   hover:border-purple-500/50 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex-1 text-right">{current.label}</span>
        <span className={`text-gray-400 text-[10px] transition-transform duration-150
                         ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* القائمة
          - position: absolute بتخليها تطير فوق باقي العناصر
          - z-[100] رقم عالي عشان يتغلب على أي overflow
          - top-full = تبدأ من تحت الزرار مباشرة
      */}
      {open && (
        <div className="absolute top-full mt-1 z-[100] min-w-[100px]
                        bg-[#1a1a2e] border border-white/15 rounded-xl
                        shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
             // نحدد الاتجاه يمين أو يسار بناءً على المتاح
             style={{ right: 0 }}
        >
          {roles.map(role => (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                setOpen(false)
                if (role.value !== currentRole) {
                  onChange(staffId, role.value as 'admin' | 'cashier')
                }
              }}
              className={`
                w-full flex items-center justify-between
                px-4 py-2.5 text-sm text-right transition-colors
                ${role.value === currentRole
                  ? 'bg-purple-600/20 text-purple-300'
                  : 'text-gray-200 hover:bg-white/8'}
              `}
            >
              <span>{role.label}</span>
              {role.value === currentRole && (
                <span className="text-purple-400 text-xs mr-2">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── StaffList ────────────────────────────────────────────────
export default function StaffList({ staffList }: Props) {
  const [loadingId,     setLoadingId]     = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [passwordStaff, setPasswordStaff] = useState<StaffMember | null>(null)

  async function handleRoleChange(staffId: string, newRole: 'admin' | 'cashier') {
    setLoadingId(staffId)
    setError(null)
    const result = await updateStaffRole(staffId, newRole)
    if (result.error) setError(result.error)
    setLoadingId(null)
  }

  async function handleDelete(staffId: string, name: string) {
    if (!confirm(`هل متأكد من حذف "${name}"؟`)) return
    setLoadingId(staffId)
    setError(null)
    const result = await deleteStaff(staffId)
    if (result.error) setError(result.error)
    setLoadingId(null)
  }

  if (staffList.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] py-16 text-center">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-sm text-gray-400">لا يوجد موظفين بعد</p>
        <p className="text-xs text-gray-600 mt-1">اضغط "إضافة موظف" لإضافة أول موظف</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-right border
                        bg-red-500/10 border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-white/[0.02]">

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-3
                        border-b border-white/5 text-xs text-gray-500">
          <span className="flex-1">الموظف</span>
          <span className="w-24 text-center">الدور</span>
          <span className="w-8 text-center">السر</span>
          <span className="w-8 text-center">حذف</span>
        </div>

        {/* Rows
            overflow-visible مهم جداً عشان الـ dropdown يطلع فوق الحدود
        */}
        <div className="divide-y divide-white/5 overflow-visible">
          {staffList.map(staff => (
            <div
              key={staff.id}
              className="flex items-center gap-4 px-5 py-4 overflow-visible"
            >

              {/* اسم + username */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {staff.full_name ?? '—'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {staff.username ? `@${staff.username}` : staff.email}
                </p>
              </div>

              {/* Custom Dropdown للدور */}
              <div className="w-24 flex justify-center">
                <RoleDropdown
                  staffId={staff.id}
                  currentRole={staff.role}
                  disabled={loadingId === staff.id}
                  onChange={handleRoleChange}
                />
              </div>

              {/* زرار تغيير كلمة السر */}
              <button
                onClick={() => setPasswordStaff(staff)}
                disabled={loadingId === staff.id}
                className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20
                           text-yellow-400 hover:bg-yellow-500/20 transition-colors
                           flex items-center justify-center text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title="تغيير كلمة السر"
              >
                🔑
              </button>

              {/* زرار حذف */}
              <button
                onClick={() => handleDelete(staff.id, staff.full_name ?? staff.email)}
                disabled={loadingId === staff.id}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20
                           text-red-400 hover:bg-red-500/20 transition-colors
                           flex items-center justify-center text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title="حذف الموظف"
              >
                {loadingId === staff.id ? '⏳' : '🗑️'}
              </button>

            </div>
          ))}
        </div>
      </div>

      {passwordStaff && (
        <ChangePasswordModal
          staff={passwordStaff}
          onClose={() => setPasswordStaff(null)}
        />
      )}
    </div>
  )
}

// ── ChangePasswordModal ──────────────────────────────────────
function ChangePasswordModal({
  staff,
  onClose,
}: {
  staff:   StaffMember
  onClose: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('كلمتا السر غير متطابقتين')
      return
    }
    if (password.length < 8) {
      setError('كلمة السر لازم تكون 8 حروف على الأقل')
      return
    }

    setLoading(true)
    const result = await updateStaffPassword(staff.id, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl" dir="rtl">

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">🔑 تغيير كلمة السر</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
          </div>

          <div className="p-6">
            {success ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white text-sm font-medium">تم تغيير كلمة السر بنجاح!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">الموظف</p>
                  <p className="text-white text-sm font-medium">{staff.full_name ?? staff.email}</p>
                  {staff.username && (
                    <p className="text-purple-400 text-xs">@{staff.username}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">كلمة السر الجديدة</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="8 أحرف على الأقل"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                               text-white text-sm placeholder-gray-600
                               focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-medium">تأكيد كلمة السر</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="أعد كتابة كلمة السر"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3
                               text-white text-sm placeholder-gray-600
                               focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm border
                                  bg-red-500/10 border-red-500/20 text-red-400">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-yellow-500/20 hover:bg-yellow-500/30
                               border border-yellow-500/30 text-yellow-300
                               disabled:opacity-50 text-sm font-bold rounded-xl transition-colors"
                  >
                    {loading ? 'جاري التغيير...' : '🔑 تغيير كلمة السر'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
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
  )
}
