// ============================================================
// FILE: src/app/admin/layout.tsx
// PURPOSE: Layout خاص بالـ Super Admin Panel
//          الحماية بتتم في proxy.ts — هنا بس نتحقق كـ backup
// ============================================================

import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'
import AdminSidebar from './components/AdminSidebar'
import { logout } from '@/app/actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Backup check — الحماية الأساسية في proxy.ts
  // لو حد وصل هنا بطريقة ما وهو مش super_admin → يتحول فوراً
  const user = await getUser()

  if (!user || user.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex" dir="rtl">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-16 bg-[#0d0d14] border-b border-red-500/10
                           flex items-center justify-between px-4 md:px-6">

          {/* Left: Title */}
          <div className="pr-12 lg:pr-0">
            <p className="text-xs text-red-400/70 mb-0.5">لوحة الإدارة العليا</p>
            <h1 className="text-sm font-semibold text-white">
              Super Admin Panel 👑
            </h1>
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3">
            {/* Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-red-500/10
                            border border-red-500/20 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Super Admin</span>
            </div>

            {/* Avatar + Logout */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center
                              justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-gray-400 hover:text-red-400 transition-colors
                             p-2 rounded-lg hover:bg-red-400/10"
                  title="تسجيل الخروج"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}
