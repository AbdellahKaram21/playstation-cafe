# ملخص جلسة التطوير — PlayStation Cafe SaaS
**آخر تحديث:** 9 يونيو 2026

---

## المشاكل اللي اتحلت

### 1. SidebarNav — الأزرار مش ظاهرة
**المشكلة:** الـ super_admin بيدخل والـ sidebar فاضي خالص.
**السبب:** الـ navItems كانت بتفلتر على `['owner', 'admin', 'cashier']` بس — و`super_admin` مش موجود فيهم.
**الحل:** أضفنا `super_admin` لكل الـ navItems.
**الملف:** `src/app/dashboard/components/SidebarNav.tsx`

---

### 2. صفحة الإعدادات — بترجع للداشبورد
**المشكلة:** الـ super_admin بيضغط على الإعدادات وبيرجع للداشبورد.
**السبب:** الشرط كان `if (user?.role !== 'owner')` — بيحجب أي حد مش owner.
**الحل:** عدلنا الشرط لـ `if (role !== 'owner' && role !== 'super_admin')`.
**الملفات:**
- `src/app/dashboard/settings/page.tsx`
- `src/app/dashboard/actions/settings.ts`

---

### 3. تنظيف قاعدة البيانات
**المشكلة:** كان فيه 4 owners تجريبيين + بياناتهم.
**الحل:** مسحنا عبر Supabase MCP:
- كل الـ sales / sessions / devices / products / subscriptions التابعة للـ tenants التجريبية
- كل الـ users غير الـ super_admin من جدول `users`
- كل الـ tenants التجريبية
- كل الـ auth users من `auth.users` غير `abdellahkaram19@gmail.com`

**النتيجة:** قاعدة البيانات نظيفة — حساب واحد فقط (super_admin).

---

### 4. ERR_TOO_MANY_REDIRECTS
**المشكلة:** حساب تجريبي كان موجود في `auth.users` بس اتمسح من جدول `users` — فبيحصل redirect loop.
**السبب:** `getUser()` بتلاقيه في Auth بس مش بتلاقيه في جدول `users` فبترجع null → redirect للـ login → loop لا نهائي.
**الحل:** مسحنا كل الـ auth users الزيادة من `auth.users` مباشرة بـ SQL.

---

### 5. POS — تعديل وحذف المنتجات من الجلسة مش بيشتغل
**المشكلة:** الكاشير بيحاول يعدل أو يحذف منتج من الجلسة وما بيحصل حاجة.
**السبب:** جدول `sales` كان عنده RLS policies لـ SELECT و INSERT بس — مفيش DELETE ولا UPDATE.
**الحل:** أضفنا الـ policies الناقصة:
```sql
CREATE POLICY "sales_delete_own_tenant" ON sales FOR DELETE USING (tenant_id = get_my_tenant_id());
CREATE POLICY "sales_update_own_tenant" ON sales FOR UPDATE USING (tenant_id = get_my_tenant_id()) WITH CHECK (tenant_id = get_my_tenant_id());
```

---

## الـ Features الجديدة

### 6. صفحة Register — إضافة رقم تليفون وعنوان
**الإضافة:** حقلين جدد في فورم التسجيل (اختياريين):
- رقم التليفون
- عنوان الكافيه

**الملفات:**
- `src/app/(auth)/register/page.tsx`
- `src/app/actions/auth.ts`

---

### 7. صفحة إدارة الموظفين (Staff)
**الميزة:** الـ owner يقدر يضيف ويعدل ويحذف موظفين (admin / cashier).

**الملفات:**
- `src/app/dashboard/actions/staff.ts` — addStaff / updateStaffRole / deleteStaff
- `src/app/dashboard/staff/page.tsx`
- `src/app/dashboard/staff/components/StaffList.tsx`
- `src/app/dashboard/staff/components/AddStaffModal.tsx`

---

### 8. تسجيل دخول بـ Username
**الميزة:** الموظفون (cashier/admin) بيدخلوا بـ username بدل إيميل. الـ owner والـ super_admin لسه بيدخلوا بالإيميل.

**التفاصيل:**
- عمود `username` (UNIQUE) اتضاف لجدول `users`
- الـ login action بتتحقق: لو فيه `@` → إيميل مباشر، لو مفيش → تبحث بالـ username وتجيب الإيميل
- الـ AddStaffModal فيه حقل username جديد مع validation

**الملفات:**
- `src/app/actions/auth.ts` — login action
- `src/app/(auth)/login/page.tsx` — UI
- `src/app/dashboard/actions/staff.ts` — addStaff
- `src/app/dashboard/staff/components/AddStaffModal.tsx`

---

### 9. POS — End Session مع Loading + Error Handling
**الإضافة:** زرار "إنهاء الجلسة" دلوقتي بيعرض loading state ورسالة خطأ لو فشل.
**الملف:** `src/app/dashboard/pos/components/OrderSummaryColumn.tsx`

---

## الـ Roles الموجودة في النظام

| الدور | الوصف | طريقة الدخول |
|---|---|---|
| `super_admin` | مطور النظام | إيميل + كلمة سر |
| `owner` | صاحب الكافيه | إيميل + كلمة سر |
| `admin` | مدير | username + كلمة سر |
| `cashier` | كاشير | username + كلمة سر |

---

## صلاحيات كل Role

| الصفحة | super_admin | owner | admin | cashier |
|---|:---:|:---:|:---:|:---:|
| الداشبورد | ✅ | ✅ | ✅ | ✅ |
| الأجهزة | ✅ | ✅ | ✅ | ✅ |
| نقطة البيع | ✅ | ✅ | ✅ | ✅ |
| المنتجات | ✅ | ✅ | ✅ | ❌ |
| التقارير | ✅ | ✅ | ✅ | ❌ |
| الموظفين | ✅ | ✅ | ❌ | ❌ |
| الإعدادات | ✅ | ✅ | ❌ | ❌ |
| لوحة الأدمن /admin | ✅ | ❌ | ❌ | ❌ |

---

## مطلوب لسه

- [ ] Offline Mode — SQLite محلي + Sync مع Supabase
- [ ] تعديل كلمة سر الموظف من صفحة الموظفين

---

## Tech Stack

- **Framework:** Next.js 16.2.5 (App Router + Turbopack)
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Pattern:** Server Actions فقط — مفيش client-side Supabase writes
- **Multi-tenancy:** كل جدول عنده `tenant_id` + RLS policies
