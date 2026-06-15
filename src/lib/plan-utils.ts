// ============================================================
// FILE: src/lib/plan-utils.ts
// PURPOSE: helper functions بسيطة للـ plans — بدون server imports
//
// ليه ملف منفصل؟
//   plans.ts بيعمل import من '@/lib/supabase/server'
//   اللي بيستخدم 'next/headers' — وده مش متاح في Client Components
//
//   لو Client Component محتاج planLabel بس (مش data fetching)
//   → يعمل import من هنا مش من plans.ts
//   → كده منعملش "import chain" يوصل لـ next/headers في الـ client
// ============================================================

// ── اسم الخطة في الـ UI ──────────────────────────────────────
// 'free' في DB → 'Normal' في الشاشة
// 'pro'        → 'Pro'
// 'enterprise' → 'Enterprise'
export function planLabel(plan: string): string {
  if (plan === 'enterprise') return 'Enterprise'
  if (plan === 'pro')        return 'Pro'
  return 'Normal'
}
