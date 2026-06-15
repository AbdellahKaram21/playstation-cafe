# PlayStation Cafe (SaaS)

تطبيق Next.js لإدارة ميزات مقاهي PlayStation مثل الخطط، الإشعارات، والتحليلات، مع استخدام Supabase كخلفية.

المتطلبات
- Node.js 20+ و npm
- مشروع Supabase (ضع بيانات الاعتماد في .env.local)

بدء سريع
1. تثبيت الحزم:
   npm install
2. تشغيل بيئة التطوير:
   npm run dev
3. بناء للإنتاج:
   npm run build
   npm run start

الأوامر المتاحة (من package.json)
- dev: next dev
- build: next build
- start: next start
- lint: eslint

البيئة
- انسخ ملف .env.local.example إلى .env.local واملأ بيانات Supabase (راجع DEVELOPMENT_LOG.md لملاحظات الإعداد).

مخطط المشروع (الملفات الهامة)
- src/app: مسارات وصفحات Next.js
- src/lib: أدوات مساعدة (راجع plan-utils.ts للأدوات الآمنة للعميل)
- public: ملفات ثابتة
- DEVELOPMENT_LOG.md: ملاحظات وسجل التطوير

ملاحظات للمساهمة
- بعض الأدوات تستورد APIs خاصة بالسيرفر (مثل next/headers). استخدم src/lib/plan-utils.ts لتجنب استيراد السيرفر داخل Client Components.
- اتبع أسلوب المشروع (TypeScript + Tailwind + Next 16). تحقق من lint عبر npm run lint.

المصادر
- توثيق Next.js: https://nextjs.org/docs
- توثيق Supabase: https://supabase.com/docs

للتواصل
- راجع DEVELOPMENT_LOG.md لمعرفة المؤلفين وسجل التعديلات.
