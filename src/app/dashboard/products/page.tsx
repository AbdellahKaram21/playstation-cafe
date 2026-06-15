// FILE: src/app/dashboard/products/page.tsx
// ✅ Server Component — بيجيب البيانات من Supabase ويمررها للـ Client Component

import { createClient } from '@/lib/supabase/server'
import AddProductModal from './components/AddProductModal'
import ProductsClient from './components/ProductsClient'
import type { ProductWithSub } from '@/types/products.types'

// re-export عشان أي ملف تاني كان بيعمل import منه يفضل شغال
export type { ProductWithSub } from '@/types/products.types'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('category',    { ascending: true })
    .order('subcategory', { ascending: true })
    .order('name',        { ascending: true })

  const typedProducts = (products ?? []) as ProductWithSub[]

  const totalProducts = typedProducts.length
  const outOfStock    = typedProducts.filter(p => p.quantity === 0 && p.is_active).length
  const lowStock      = typedProducts.filter(p => p.quantity > 0 && p.quantity <= 5 && p.is_active).length

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl pt-10 lg:pt-0" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">المنتجات والمخزون</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalProducts} منتج
            {outOfStock > 0 && <span className="text-red-400"> — {outOfStock} نفد</span>}
            {lowStock   > 0 && <span className="text-yellow-400"> — {lowStock} قارب النفاد</span>}
          </p>
        </div>
        <AddProductModal />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { label: 'إجمالي المنتجات', value: totalProducts, color: 'purple' },
          { label: 'نفد من المخزون',  value: outOfStock,    color: 'red'    },
          { label: 'قارب النفاد',      value: lowStock,      color: 'yellow' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 md:p-4 text-center
            ${s.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' : ''}
            ${s.color === 'red'    ? 'border-red-500/20    bg-red-500/5'    : ''}
            ${s.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' : ''}
          `}>
            <p className={`text-xl md:text-2xl font-bold
              ${s.color === 'purple' ? 'text-purple-400' : ''}
              ${s.color === 'red'    ? 'text-red-400'    : ''}
              ${s.color === 'yellow' ? 'text-yellow-400' : ''}
            `}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Products Accordion (Client Component) ── */}
      <ProductsClient products={typedProducts} />

    </div>
  )
}
