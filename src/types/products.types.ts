// ============================================================
// FILE: src/types/products.types.ts
// الأنواع والثوابت المشتركة لصفحة المنتجات
// منفصلة عن page.tsx لتجنب الـ circular dependency
// ============================================================

// ── نوع المنتج المستخدم في صفحة المنتجات ──────────────────
// مطابق لـ Product في database.types.ts لكن explicit
// عشان ProductsClient و EditProductModal و page.tsx يشتركوا فيه
// من غير ما حد يعمل import من حد
export type ProductWithSub = {
  id: string
  name: string
  category: string | null
  subcategory: string | null
  quantity: number
  buy_price: number
  sell_price: number
  is_active: boolean
  tenant_id: string
  created_at: string
}

// ── التصنيفات الرئيسية والفرعية ───────────────────────────
// معرفة مرة واحدة هنا ومستخدمة في AddProductModal و EditProductModal
// بدل ما تتكرر في كل ملف
export const CATEGORIES = [
  {
    name: 'مشروبات',
    icon: '🥤',
    subcategories: ['مشروبات باردة', 'مشروبات ساخنة'],
  },
  {
    name: 'سناكس',
    icon: '🍿',
    subcategories: ['شيبسي', 'بسكويت وحلويات', 'مكسرات'],
  },
  {
    name: 'وجبات',
    icon: '🍔',
    subcategories: ['ساندوتشات', 'وجبات سريعة'],
  },
] as const
