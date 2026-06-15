'use client'
// FILE: src/app/dashboard/products/components/EditProductModal.tsx

import { useState, useEffect, useRef } from 'react'
import { updateProduct, restockProduct } from '../../actions/products'
import { CATEGORIES } from '@/types/products.types'
import type { ProductWithSub } from '@/types/products.types'

export default function EditProductModal({ product }: { product: ProductWithSub }) {
  const [isOpen, setIsOpen]   = useState(false)
  const [tab, setTab]         = useState<'edit' | 'restock'>('edit')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [addQty, setAddQty]   = useState(1)

  // التصنيف الرئيسي — يبدأ بقيمة المنتج الحالية
  const [isCatOpen, setIsCatOpen]     = useState(false)
  const [selectedCat, setSelectedCat] = useState(product.category || '')
  const catRef = useRef<HTMLDivElement>(null)

  // التصنيف الفرعي — يبدأ بقيمة المنتج الحالية
  const [isSubOpen, setIsSubOpen]     = useState(false)
  const [selectedSub, setSelectedSub] = useState(product.subcategory || '')
  const subRef = useRef<HTMLDivElement>(null)

  // الـ subcategories المتاحة بناءً على التصنيف الرئيسي
  const availableSubs = CATEGORIES.find(c => c.name === selectedCat)?.subcategories ?? []

  // لما يتغير التصنيف الرئيسي، نصفّر الفرعي
  function handleSelectCat(catName: string) {
    setSelectedCat(catName)
    setSelectedSub('')
    setIsCatOpen(false)
  }

  // إغلاق القوائم عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catRef.current && !catRef.current.contains(event.target as Node)) setIsCatOpen(false)
      // ✅ subRef ممكن يكون null لو التصنيف الفرعي مش ظاهر — نتحقق قبل
      if (subRef.current && !subRef.current.contains(event.target as Node)) setIsSubOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClose() {
    setIsOpen(false)
    setIsCatOpen(false)
    setIsSubOpen(false)
    setError('')
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.append('category', selectedCat)
    formData.append('subcategory', selectedSub)

    const result = await updateProduct(product.id, formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      handleClose()
      setLoading(false)
    }
  }

  async function handleRestock() {
    setLoading(true)
    setError('')
    const result = await restockProduct(product.id, addQty)
    if (result.error) {
      setError(result.error)
    } else {
      setAddQty(1)
      handleClose()
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setTab('edit'); setError('') }}
        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        title="تعديل المنتج"
      >✏️</button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-purple-500/5">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">{product.name}</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white text-xl transition-colors">×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white/[0.03] border border-white/5 rounded-xl p-1">
              {(['edit', 'restock'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 text-[11px] py-2.5 rounded-lg font-bold transition-all
                    ${tab === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
                  {t === 'edit' ? '✏️ تعديل البيانات' : '📦 تعبئة المخزون'}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 mb-4 text-sm">{error}</div>
            )}

            {/* ── Edit Tab ── */}
            {tab === 'edit' && (
              <form onSubmit={handleEdit} className="space-y-4" dir="rtl">

                {/* اسم المنتج */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">اسم المنتج</label>
                  <input name="name" type="text" required defaultValue={product.name}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 hover:bg-white/[0.05] transition-all" />
                </div>

                {/* التصنيف الرئيسي */}
                <div className="space-y-1.5" ref={catRef}>
                  <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">التصنيف الرئيسي</label>
                  <div className="relative">
                    <div
                      onClick={() => setIsCatOpen(!isCatOpen)}
                      className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-sm cursor-pointer transition-all flex items-center justify-between
                        ${isCatOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:bg-white/[0.05]'}`}
                    >
                      <span className={selectedCat ? 'text-white' : 'text-gray-600'}>
                        {selectedCat
                          ? <span className="flex items-center gap-2">{CATEGORIES.find(c => c.name === selectedCat)?.icon} {selectedCat}</span>
                          : 'بدون تصنيف'}
                      </span>
                      <span className={`text-[10px] transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {isCatOpen && (
                      <ul className="absolute z-[60] w-full mt-2 bg-[#161625] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                        <li onClick={() => { setSelectedCat(''); setSelectedSub(''); setIsCatOpen(false) }}
                          className="px-4 py-3 text-sm text-gray-400 hover:bg-white/5 cursor-pointer">
                          بدون تصنيف
                        </li>
                        {CATEGORIES.map((c) => (
                          <li key={c.name} onClick={() => handleSelectCat(c.name)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white cursor-pointer transition-colors">
                            <span>{c.icon}</span> {c.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* التصنيف الفرعي — بيظهر بس لو في تصنيف رئيسي */}
                {selectedCat && (
                  <div className="space-y-1.5" ref={subRef}>
                    <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">التصنيف الفرعي</label>
                    <div className="relative">
                      <div
                        onClick={() => setIsSubOpen(!isSubOpen)}
                        className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-sm cursor-pointer transition-all flex items-center justify-between
                          ${isSubOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:bg-white/[0.05]'}`}
                      >
                        <span className={selectedSub ? 'text-white' : 'text-gray-600'}>
                          {selectedSub || 'اختر التصنيف الفرعي'}
                        </span>
                        <span className={`text-[10px] transition-transform duration-200 ${isSubOpen ? 'rotate-180' : ''}`}>▼</span>
                      </div>

                      {isSubOpen && (
                        <ul className="absolute z-[60] w-full mt-2 bg-[#161625] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                          <li onClick={() => { setSelectedSub(''); setIsSubOpen(false) }}
                            className="px-4 py-3 text-sm text-gray-400 hover:bg-white/5 cursor-pointer">
                            بدون تصنيف فرعي
                          </li>
                          {availableSubs.map((sub) => (
                            <li key={sub} onClick={() => { setSelectedSub(sub); setIsSubOpen(false) }}
                              className="px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white cursor-pointer transition-colors">
                              {sub}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* الأسعار والكمية */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] text-gray-400 uppercase">الكمية</label>
                    <input name="quantity" type="number" required defaultValue={product.quantity}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] text-gray-400 uppercase">شراء</label>
                    <input name="buy_price" type="number" required step="0.5" defaultValue={product.buy_price}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] text-gray-400 uppercase">بيع</label>
                    <input name="sell_price" type="number" required step="0.5" defaultValue={product.sell_price}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                    إلغاء
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                    {loading ? '...' : 'حفظ'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Restock Tab ── */}
            {tab === 'restock' && (
              <div className="space-y-6" dir="rtl">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">المخزون الحالي</p>
                  <p className={`text-4xl font-black ${product.quantity <= 5 ? 'text-orange-500' : 'text-white'}`}>
                    {product.quantity}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] text-gray-400 mr-1 uppercase text-center block">إضافة كمية جديدة</label>
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-2">
                    <button onClick={() => setAddQty(q => Math.max(1, q - 1))}
                      className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white text-xl font-bold transition-all">−</button>
                    <span className="text-3xl font-black text-white">{addQty}</span>
                    <button onClick={() => setAddQty(q => q + 1)}
                      className="w-12 h-12 rounded-xl bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-white text-xl font-bold transition-all">+</button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all">إلغاء</button>
                  <button onClick={handleRestock} disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                    {loading ? '...' : `تعبئة +${addQty}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
