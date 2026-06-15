// ============================================================
// FILE: src/app/admin/tenants/new/page.tsx
// PURPOSE: صفحة إضافة كافيه جديد — Super Admin فقط
//
// الصفحة دي Server Component بتعرض فورم
// لما الفورم يتبعت، بيستدعي createTenant() Server Action
// لو نجح → redirect لصفحة الكافيه الجديد
// ============================================================

import NewTenantForm from './NewTenantForm'

export default function NewTenantPage() {
  return (
    <div className="max-w-xl" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">إضافة كافيه جديد 🏪</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          إنشاء tenant جديد في النظام يدوياً
        </p>
      </div>

      {/* Form — Client Component عشان نحتاج useState للـ loading */}
      <NewTenantForm />

    </div>
  )
}
