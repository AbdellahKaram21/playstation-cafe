'use client'
// FILE: src/app/dashboard/products/components/AddProductModal.tsx

import { useState, useEffect, useRef } from 'react'
import { addProduct } from '../../actions/products'
import { CATEGORIES } from '@/types/products.types'

export default function AddProductModal() {
  const [isOpen, setIsOpen]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // التصنيف الرئيسي
  const [isCatOpen, setIsCatOpen]     = useState(false)
  const [selectedCat, setSelectedCat] = useState('')
  const catRef = useRef<HTMLDivElement>(null)

  // التصنيف الفرعي
  const [isSubOpen, setIsSubOpen]     = useState(false)
  const [selectedSub, setSelectedSub] = useState('')
  const subRef = useRef<HTMLDivElement>(null)

  // الـ subcategories المتاحة بناءً على التصنيف الرئيسي المختار
  const availableSubs = CATEGORIES.find(c => c.name === selectedCat)?.subcategories ?? []

  // لما يتغير التصنيف الرئيسي، نصفّر التصنيف الفرعي
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
    setSelectedCat('')
    setSelectedSub('')
    setIsCatOpen(false)
    setIsSubOpen(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // ✅ نحفظ reference للفورم قبل أي await
    const form = e.currentTarget

    const formData = new FormData(form)
    formData.append('category', selectedCat)
    formData.append('subcategory', selectedSub)

    const result = await addProduct(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // ✅ نعمل reset قبل handleClose عشان الـ form لسه موجود
      form.reset()
      handleClose()
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500
                   text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <span className="text-base">+</span> إضافة منتج
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-purple-500/5">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">إضافة منتج جديد</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors text-xl">×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">

              {/* اسم المنتج */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 mr-1 uppercase tracking-wider">اسم المنتج</label>
                <input
                  name="name" type="text" required placeholder="مثال: بيبسي كان"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 hover:bg-white/[0.05] transition-all"
                />
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
                        : 'اختر التصنيف'}
                    </span>
                    <span className={`text-[10px] transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>

                  {isCatOpen && (
                    <ul className="absolute z-[60] w-full mt-2 bg-[#161625] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                      {CATEGORIES.map((c) => (
                        <li
                          key={c.name}
                          onClick={() => handleSelectCat(c.name)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white cursor-pointer transition-colors"
                        >
                          <span>{c.icon}</span> {c.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* التصنيف الفرعي — بيظهر بس لو اتختار تصنيف رئيسي */}
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
                        <li
                          onClick={() => { setSelectedSub(''); setIsSubOpen(false) }}
                          className="px-4 py-3 text-sm text-gray-400 hover:bg-white/5 cursor-pointer"
                        >
                          بدون تصنيف فرعي
                        </li>
                        {availableSubs.map((sub) => (
                          <li
                            key={sub}
                            onClick={() => { setSelectedSub(sub); setIsSubOpen(false) }}
                            className="px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white cursor-pointer transition-colors"
                          >
                            {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* الكمية والأسعار */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 text-center block uppercase">الكمية</label>
                  <input name="quantity" type="number" required defaultValue="0"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-2 py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 text-center block uppercase">شراء</label>
                  <input name="buy_price" type="number" required step="0.1"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-2 py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 text-center block uppercase">بيع</label>
                  <input name="sell_price" type="number" required step="0.1"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-2 py-3 text-white text-center text-sm focus:border-purple-500 outline-none transition-all" />
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                  إلغاء
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all">
                  {loading ? '...' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
