'use client'
// ============================================================
// FILE: src/app/dashboard/pos/components/ProductGrid.tsx
// شبكة المنتجات في الـ POS — accordion بالتصنيفات
// ============================================================

import { useState }       from 'react'
import { sellProduct }    from '../../actions/products'
import type { Product }   from '@/types/database.types'

type Session = {
  id: string
  start_time: string
  hourly_rate: number
  products_total: number
  devices: { id: string; name: string; type: string }
}

type Props = {
  products: Product[]
  sessions: Session[]
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
}

// ✅ نوع موسّع يضيف subcategory لـ Product
// لأن database.types.ts عنده subcategory بس ممكن يكون غير موجود في النوع القديم
type ProductWithSub = Product & { subcategory?: string | null }

const categoryIcons: Record<string, string> = {
  'مشروبات': '🥤',
  'سناكس':   '🍿',
  'وجبات':   '🍔',
}

export default function ProductGrid({
  products,
  sessions,
  selectedSessionId,
  onSelectSession,
}: Props) {
  const [selling,  setSelling]  = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null)

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [openSubcats,    setOpenSubcats]    = useState<Record<string, boolean>>({})

  // ✅ تجميع المنتجات بدون any cast
  type Grouped = Record<string, Record<string, ProductWithSub[]>>
  const grouped = (products as ProductWithSub[]).reduce<Grouped>((acc, p) => {
    const cat = p.category    ?? 'أخرى'
    const sub = p.subcategory ?? 'عام'
    if (!acc[cat])      acc[cat]      = {}
    if (!acc[cat][sub]) acc[cat][sub] = []
    acc[cat][sub].push(p)
    return acc
  }, {})

  function toggleCategory(cat: string) {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }
  function toggleSubcat(key: string) {
    setOpenSubcats(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSell(product: ProductWithSub) {
    if (!selectedSessionId) {
      alert('اختر جلسة أولاً من القائمة على اليمين')
      return
    }
    setSelling(product.id)
    setFeedback(null)
    const result = await sellProduct(product.id, 1, selectedSessionId)
    setFeedback({ id: product.id, ok: !result.error })
    setSelling(null)
    setTimeout(() => setFeedback(null), 2000)
    if (result.error) alert(result.error)
  }

  return (
    <div className={`
      flex-1 overflow-y-auto custom-scrollbar
      bg-[#0a0a0f] border border-white/5 rounded-2xl p-4
      ${!selectedSessionId ? 'opacity-60' : ''}
    `}>

      {/* تحذير لو مفيش جلسة مختارة */}
      {!selectedSessionId && (
        <div className="text-center py-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-400 text-xs">اختر جلسة أولاً لتفعيل البيع</p>
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(grouped).map(([category, subcats]) => {
          const isCatOpen  = !!openCategories[category]
          const totalCount = Object.values(subcats).flat().length

          return (
            <div key={category} className="rounded-xl border border-white/5 overflow-hidden">

              {/* رأس التصنيف الرئيسي */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3
                           bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-right"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{categoryIcons[category] ?? '📦'}</span>
                  <span className="text-sm font-bold text-white">{category}</span>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                </div>
                <span
                  className="text-gray-400 transition-transform duration-200 text-xs inline-block"
                  style={{ transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >▼</span>
              </button>

              {/* محتوى التصنيف الرئيسي */}
              {isCatOpen && (
                <div className="px-3 py-2 space-y-1 bg-black/20">
                  {Object.entries(subcats).map(([subcategory, items]) => {
                    const subKey    = `${category}__${subcategory}`
                    const isSubOpen = !!openSubcats[subKey]

                    return (
                      <div key={subcategory} className="rounded-lg border border-white/[0.06] overflow-hidden">

                        {/* رأس التصنيف الفرعي */}
                        <button
                          onClick={() => toggleSubcat(subKey)}
                          className="w-full flex items-center justify-between px-3 py-2.5
                                     bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-right"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
                            <span className="text-xs font-semibold text-gray-300">{subcategory}</span>
                            <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">
                              {items.length}
                            </span>
                          </div>
                          <span
                            className="text-gray-500 transition-transform duration-200 text-[10px] inline-block"
                            style={{ transform: isSubOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          >▼</span>
                        </button>

                        {/* منتجات التصنيف الفرعي */}
                        {isSubOpen && (
                          <div className="p-2 grid grid-cols-2 gap-2 bg-black/10">
                            {items.map((product) => {
                              const isSelling = selling === product.id
                              const fb = feedback?.id === product.id ? feedback : null

                              return (
                                <button
                                  key={product.id}
                                  onClick={() => handleSell(product)}
                                  disabled={!!selling || !selectedSessionId}
                                  className={`
                                    relative p-3 rounded-xl border text-right transition-all duration-200
                                    ${fb?.ok === true  ? 'border-green-500/50 bg-green-500/10 scale-95' : ''}
                                    ${fb?.ok === false ? 'border-red-500/50   bg-red-500/10   scale-95' : ''}
                                    ${!fb
                                      ? 'border-white/5 bg-white/[0.03] hover:border-purple-500/40 hover:bg-purple-500/10 hover:-translate-y-0.5'
                                      : ''}
                                    ${!selectedSessionId ? 'cursor-not-allowed' : 'cursor-pointer'}
                                  `}
                                >
                                  {/* Feedback overlay */}
                                  {fb && (
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl rounded-xl bg-black/40 z-10">
                                      {fb.ok ? '✅' : '❌'}
                                    </div>
                                  )}

                                  <p className="text-xs font-bold mb-2 text-gray-200 leading-tight">
                                    {product.name}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <span className="text-purple-400 font-black text-xs bg-purple-500/10 px-1.5 py-0.5 rounded-lg border border-purple-500/20">
                                      {product.sell_price} ج
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-medium
                                      ${product.quantity <= 5
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-black/50 text-gray-500'
                                      }`}>
                                      {isSelling ? '...' : `${product.quantity}`}
                                    </span>
                                  </div>
                                </button>
                              )
                            })}
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
    </div>
  )
}
