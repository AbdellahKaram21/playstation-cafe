// ============================================================
// FILE: src/app/admin/tenants/page.tsx
// PURPOSE: Server Component — بيجيب البيانات من DB
//          وبيمررها لـ TenantsClient اللي بيتحكم في البحث والفلتر
//
// ليه الفصل ده؟
//   Server Component: قادر يتواصل مع DB مباشرةً (أسرع + أأمن)
//   Client Component: قادر يستخدم useState للبحث التفاعلي
//   الحل = Server يجيب البيانات → Client يعرضها ويفلترها
// ============================================================

import { getTenants } from '../actions'
import TenantsClient from './TenantsClient'

export default async function TenantsPage() {
  // بنجيب كل الـ tenants من السيرفر مرة واحدة
  const tenants = await getTenants()

  // بنمرر البيانات للـ Client Component
  // كل الـ filtering بيحصل في المتصفح بدون requests جديدة
  return <TenantsClient tenants={tenants} />
}
