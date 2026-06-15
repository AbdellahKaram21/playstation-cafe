'use client'
// ============================================================
// FILE: src/app/dashboard/components/DashboardHeader.tsx
// ============================================================

import { logout } from '@/app/actions/auth'
import type { User } from '@/types/database.types'
import type { AppNotification } from '@/lib/notifications'
import NotificationCenter from './NotificationCenter'

type Props = {
  user:          User
  notifications: AppNotification[]
}

export default function DashboardHeader({ user, notifications }: Props) {
  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <header className="h-16 bg-[#0d0d14] border-b border-white/5 flex items-center justify-between px-4 md:px-6">

      {/* Left: Page Title */}
      <div className="pr-12 lg:pr-0">
        <p className="text-xs text-gray-500 mb-0.5">لوحة التحكم</p>
        <h1 className="text-sm font-semibold text-white">
          أهلاً، {user.full_name?.split(' ')[0] || 'بك'} 👋
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">نظام شغال</span>
        </div>

        {/* 🔔 Notification Bell */}
        <NotificationCenter notifications={notifications} />

        {/* Avatar + User Info + Logout */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>

          {/* Name + Email — مخفي على الموبايل */}
          <div className="hidden md:block">
            <p className="text-xs font-medium text-white">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
              title="تسجيل الخروج"
            >
              →
            </button>
          </form>

        </div>
      </div>
    </header>
  )
}
