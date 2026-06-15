// FILE: src/app/dashboard/products/components/ProductsClient.tsx
// ✅ Client Component — accordion للتصنيفات الرئيسية والفرعية

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EditProductModal from './EditProductModal'
import { toggleProduct } from '@/app/dashboard/actions/products'
import type { ProductWithSub } from '@/types/products.types'

const categoryIcons: Record<string, string> = {
  'مشروبات':    '🥤',
  'سناكس':      '🍿',
  'وجبات':      '🍔',
  'بدون تصنيف': '📦',
}

export default function ProductsClient({ products }: { products: ProductWithSub[] }) {
  const router = useRouter()
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [openSubcats,    setOpenSubcats]    = useState<Record<string, boolean>>({})
  const [toggling,       setToggling]       = useState<string | null>(null)
  const [toggleError,    setToggleError]    = useState<string | null>(null)

  function toggleCat(cat: string) {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }
  function toggleSub(key: string) {
    setOpenSubcats(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // ✅ مصلح: error handling لو toggleProduct فشل
  async function handleToggle(id: string, newStatus: boolean) {
    setToggling(id)
    setToggleError(null)
    const result = await toggleProduct(id, newStatus)
    if (result.error) {
      setToggleError(result.error)
    } else {
      router.refresh()
    }
    setToggling(null)
  }

  // تجميع: category → subcategory → products[]
  type Grouped = Record<string, Record<string, ProductWithSub[]>>
  const grouped = products.reduce<Grouped>((acc, p) => {
    const cat = p.category    || 'بدون تصنيف'
    const sub = p.subcategory || 'عام'
    if (!acc[cat])      acc[cat]      = {}
    if (!acc[cat][sub]) acc[cat][sub] = []
    acc[cat][sub].push(p)
    return acc
  }, {})

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] py-16 text-center">
        <div className="text-5xl mb-3">📦</div>
        <p className="text-sm text-gray-400">لا توجد منتجات بعد</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">

      {/* رسالة خطأ الـ toggle لو حصلت */}
      {toggleError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm">
          {toggleError}
        </div>
      )}

      {Object.entries(grouped).map(([category, subcats]) => {
        const isCatOpen  = !!openCategories[category]
        const totalCount = Object.values(subcats).flat().length

        return (
          <div key={category} className="rounded-xl border border-white/[0.08] overflow-hidden">

            {/* ── رأس التصنيف الرئيسي ── */}
            <button
              onClick={() => toggleCat(category)}
              className="w-full flex items-center justify-between px-5 py-4
                         bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{categoryIcons[category] ?? '📦'}</span>
                <span className="text-base font-bold text-white">{category}</span>
                <span className="text-xs text-gray-500 bg-white/5 border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                  {totalCount} منتج
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-xs hidden sm:block">{isCatOpen ? 'إغلاق' : 'عرض'}</span>
                <span
                  className="text-sm inline-block transition-transform duration-200"
                  style={{ transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >▼</span>
              </div>
            </button>

            {/* ── محتوى التصنيف الرئيسي ── */}
            {isCatOpen && (
              <div className="px-4 py-3 space-y-2 bg-black/15 border-t border-white/5">
                {Object.entries(subcats).map(([subcategory, items]) => {
                  const subKey    = `${category}__${subcategory}`
                  const isSubOpen = !!openSubcats[subKey]

                  return (
                    <div key={subcategory} className="rounded-xl border border-white/[0.06] overflow-hidden">

                      {/* رأس التصنيف الفرعي */}
                      <button
                        onClick={() => toggleSub(subKey)}
                        className="w-full flex items-center justify-between px-4 py-3
                                   bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-right"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 rounded-full bg-purple-500/60" />
                          <span className="text-sm font-semibold text-gray-300">{subcategory}</span>
                          <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                            {items.length} منتج
                          </span>
                        </div>
                        <span
                          className="text-gray-500 text-xs inline-block transition-transform duration-200"
                          style={{ transform: isSubOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >▼</span>
                      </button>

                      {/* ── منتجات التصنيف الفرعي ── */}
                      {isSubOpen && (
                        <div className="border-t border-white/5">

                          {/* DESKTOP */}
                          <div className="hidden md:block divide-y divide-white/5">
                            {items.map(product => (
                              <div
                                key={product.id}
                                className={`flex items-center gap-4 px-5 py-3.5 bg-white/[0.01]
                                  ${!product.is_active ? 'opacity-40' : ''}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-white truncate">{product.name}</p>
                                    {product.quantity === 0 && product.is_active && (
                                      <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">نفد</span>
                                    )}
                                    {product.quantity > 0 && product.quantity <= 5 && (
                                      <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">قارب النفاد</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    شراء: {product.buy_price} ج &nbsp;•&nbsp; بيع: {product.sell_price} ج
                                  </p>
                                </div>

                                <div className="text-center min-w-16">
                                  <p className={`text-lg font-bold
                                    ${product.quantity === 0 ? 'text-red-400'
                                    : product.quantity <= 5  ? 'text-yellow-400'
                                    :                          'text-white'}`}>
                                    {product.quantity}
                                  </p>
                                  <p className="text-xs text-gray-500">قطعة</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <EditProductModal product={product} />
                                  <button
                                    onClick={() => handleToggle(product.id, !product.is_active)}
                                    disabled={toggling === product.id}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50
                                      ${product.is_active
                                        ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                        : 'border-green-500/20 text-green-400 hover:bg-green-500/10'}`}
                                  >
                                    {toggling === product.id ? '...' : (product.is_active ? 'إخفاء' : 'إظهار')}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* MOBILE */}
                          <div className="md:hidden divide-y divide-white/5">
                            {items.map(product => (
                              <div
                                key={product.id}
                                className={`p-4 bg-white/[0.01] ${!product.is_active ? 'opacity-40' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white">{product.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      شراء: {product.buy_price} ج &nbsp;•&nbsp; بيع: {product.sell_price} ج
                                    </p>
                                  </div>
                                  <div className="text-center shrink-0">
                                    <p className={`text-xl font-black
                                      ${product.quantity === 0 ? 'text-red-400'
                                      : product.quantity <= 5  ? 'text-yellow-400'
                                      :                          'text-white'}`}>
                                      {product.quantity}
                                    </p>
                                    <p className="text-xs text-gray-500">قطعة</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex gap-1.5 flex-wrap">
                                    {product.quantity === 0 && product.is_active && (
                                      <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">نفد</span>
                                    )}
                                    {product.quantity > 0 && product.quantity <= 5 && (
                                      <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">قارب النفاد</span>
                                    )}
                                    {!product.is_active && (
                                      <span className="text-xs bg-white/5 text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">مخفي</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <EditProductModal product={product} />
                                    <button
                                      onClick={() => handleToggle(product.id, !product.is_active)}
                                      disabled={toggling === product.id}
                                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50
                                        ${product.is_active
                                          ? 'border-white/10 text-gray-400'
                                          : 'border-green-500/20 text-green-400'}`}
                                    >
                                      {toggling === product.id ? '...' : (product.is_active ? 'إخفاء' : 'إظهار')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
