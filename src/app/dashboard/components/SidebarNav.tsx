'use client'
// ============================================================
// FILE: src/app/dashboard/components/SidebarNav.tsx
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/database.types'

const navItems = [
  { href: '/dashboard',          label: 'الرئيسية',   icon: '⊞',  roles: ['owner', 'admin', 'cashier', 'super_admin'] as UserRole[], exact: true  },
  { href: '/dashboard/devices',  label: 'الأجهزة',    icon: '🎮', roles: ['owner', 'admin', 'cashier', 'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/pos',      label: 'نقطة البيع', icon: '🛒', roles: ['owner', 'admin', 'cashier', 'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/products', label: 'المنتجات',   icon: '📦', roles: ['owner', 'admin',             'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/reports',  label: 'التقارير',   icon: '📊', roles: ['owner', 'admin',             'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/staff',    label: 'الموظفين',   icon: '👥', roles: ['owner',                      'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/settings', label: 'الإعدادات',  icon: '⚙️', roles: ['owner',                      'super_admin'] as UserRole[], exact: false },
  { href: '/dashboard/upgrade',  label: 'الترقية',    icon: '💳', roles: ['owner',                      'super_admin'] as UserRole[], exact: false },
]

export default function SidebarNav({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const filteredItems = navItems.filter(item => item.roles.includes(userRole))

  const navContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-sm">
            🎮
          </div>
          <span className="font-bold text-white text-sm tracking-wide">PS Cafe</span>
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
        {filteredItems.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          // الترقية ليها تصميم مختلف — بارزة أكتر
          const isUpgrade = item.href === '/dashboard/upgrade'

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150
                ${isUpgrade && !isActive
                  ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20'
                  : isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Role Badge */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">
            {userRole === 'owner'       && 'مالك'}
            {userRole === 'admin'       && 'مدير'}
            {userRole === 'cashier'     && 'كاشير'}
            {userRole === 'super_admin' && 'سوبر أدمن'}
          </span>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* DESKTOP */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-[#0d0d14] border-r border-white/5 flex-col">
        {navContent}
      </aside>

      {/* MOBILE زرار */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-10 h-10
                   bg-[#0d0d14] border border-white/10 rounded-xl
                   flex items-center justify-center text-white shadow-lg"
        aria-label="فتح القائمة"
      >
        ☰
      </button>

      {/* MOBILE DRAWER */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/70"
            onClick={() => setOpen(false)}
          />
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
