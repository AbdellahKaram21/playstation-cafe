'use client'
// ============================================================
// FILE: src/app/admin/components/AdminSidebar.tsx
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin',                  label: 'الإحصائيات',    icon: '📊', exact: true  },
  { href: '/admin/tenants',          label: 'الكافيهات',     icon: '🏪', exact: false },
  { href: '/admin/upgrade-requests', label: 'طلبات الترقية', icon: '💳', exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-sm">
            👑
          </div>
          <div>
            <span className="font-bold text-white text-sm block">Super Admin</span>
            <span className="text-xs text-red-400">لوحة الإدارة العليا</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="mr-auto text-gray-400 hover:text-white text-2xl lg:hidden"
          aria-label="إغلاق القائمة"
        >
          ×
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150
                ${isActive
                  ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-red-400" />}
            </Link>
          )
        })}
      </nav>

      {/* رابط الرجوع للـ dashboard */}
      <div className="p-4 border-t border-white/5 shrink-0 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5
                     hover:bg-white/10 transition-colors text-sm text-gray-400 hover:text-white"
        >
          <span>←</span>
          <span>الرجوع للداشبورد</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-red-400">Super Admin</span>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex w-64 min-h-screen bg-[#0d0d14] border-r border-white/5 flex-col">
        {navContent}
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-10 h-10
                   bg-[#0d0d14] border border-red-500/30 rounded-xl
                   flex items-center justify-center text-white shadow-lg"
        aria-label="فتح قائمة الإدارة"
      >
        ☰
      </button>

      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed top-0 right-0 z-50 w-64 h-full
                            bg-[#0d0d14] border-l border-white/10
                            flex flex-col shadow-2xl">
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
