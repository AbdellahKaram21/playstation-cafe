// ============================================================
// FILE: src/app/page.tsx
//
// الـ Home Page (/) — بتعمل redirect تلقائي
//
// ليه redirect ومش Landing Page؟
//   - المشروع دلوقتي SaaS app مش موقع تسويقي
//   - الـ middleware في proxy.ts بيتحكم في الـ routing:
//     * لو logged in  → يروح /dashboard
//     * لو مش logged in → الـ middleware يحوله لـ /login
//
// لما تعمل Landing Page في المستقبل هتبدل الـ redirect ده
// ============================================================

import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
