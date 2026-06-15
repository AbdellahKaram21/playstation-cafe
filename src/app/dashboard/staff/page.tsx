// ============================================================
// FILE: src/app/dashboard/staff/page.tsx
// صفحة إدارة الموظفين — للـ owner و super_admin بس
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { getUser }      from '@/app/actions/auth'
import { redirect }     from 'next/navigation'
import StaffList        from './components/StaffList'
import AddStaffModal    from './components/AddStaffModal'

export default async function StaffPage() {
  const supabase = await createClient()
  const user     = await getUser()

  if (user?.role !== 'owner' && user?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const { data: staffList } = await supabase
    .from('users')
    .select('id, full_name, email, username, role, created_at')
    .eq('tenant_id', user.tenant_id)
    .neq('role', 'owner')
    .neq('role', 'super_admin')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl pt-10 lg:pt-0" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">إدارة الموظفين</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            أضف وادر موظفيك — {staffList?.length ?? 0} موظف
          </p>
        </div>
        <AddStaffModal />
      </div>

      <StaffList staffList={staffList ?? []} />

    </div>
  )
}
