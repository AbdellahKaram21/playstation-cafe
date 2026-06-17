// ============================================================
// FILE: src/middleware.ts
//
// ده ملف الـ middleware الرسمي اللي Next.js وVercel بيدوروا عليه
// بالاسم ده تحديداً.
//
// الكود الحقيقي موجود في src/proxy.ts عشان:
//   - Next.js 16 بيستخدم اسم "proxy" كـ convention جديد
//   - بس Vercel Edge Runtime لسه بيدور على "middleware.ts"
//
// الحل: بنعمل re-export من proxy.ts هنا
// يعني نفس الكود بيشتغل من الملفين
// ============================================================

export { proxy as middleware, config } from './proxy'
