'use client'
// ============================================================
// FILE: src/app/dashboard/pos/components/OrderSummaryColumn.tsx
// عمود ملخص الطلب في الـ POS — بيعرض الجلسة المختارة
// مع تكلفة الوقت اللحظية وزرار تعديل الطلبات وإنهاء الجلسة
// ============================================================

import { useState, useEffect } from 'react'
import { createPortal }        from 'react-dom'
import { useRouter }           from 'next/navigation'
import { endSession }          from '@/app/dashboard/actions/devices'
import { updateSaleQuantity, deleteSale } from '@/app/dashboard/actions/products'

// ── Types ───────────────────────────────────────────────────
type Sale = {
  id: string
  product_id: string
  quantity: number
  products: { id: string; name: string; sell_price: number }
}

export type Session = {
  id: string
  start_time: string
  hourly_rate: number
  products_total: number
  type: 'open' | 'limited'
  duration_minutes: number | null
  devices: { id: string; name: string; type: string }
  sales?: Sale[]
}

const deviceIcons: Record<string, string> = {
  PS5: '🎮', PS4: '🕹️', PC: '💻', VR: '🥽', Ping: '🏓',
}

// ── المكوّن الرئيسي ─────────────────────────────────────────
export default function OrderSummaryColumn({ session }: { session: Session | null }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showEditModal,  setShowEditModal]  = useState(false)

  useEffect(() => {
    if (!session) return
    const calc = () =>
      Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000)
    setElapsedSeconds(calc())
    const interval = setInterval(() => setElapsedSeconds(calc()), 1000)
    return () => clearInterval(interval)
  }, [session?.id, session?.start_time])

  // لو مفيش جلسة مختارة
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed
                      border-white/10 rounded-2xl text-center p-6 min-h-[120px]">
        <p className="text-4xl mb-3">👉</p>
        <p className="text-gray-500 text-sm">اختر جلسة من القائمة</p>
      </div>
    )
  }

  const sessionCost   = (elapsedSeconds / 3600) * session.hourly_rate
  const productsTotal = session.sales
    ? session.sales.reduce((sum, s) => sum + s.quantity * s.products.sell_price, 0)
    : (session.products_total ?? 0)
  const grandTotal = sessionCost + productsTotal

  async function handleEndSession() {
    await endSession(session!.id)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* اسم الجهاز */}
      <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">الجلسة المختارة</p>
        <p className="text-white font-bold text-lg">
          {deviceIcons[session.devices?.type]} {session.devices?.name}
        </p>
      </div>

      {/* المنتجات المضافة */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 font-medium">المنتجات المضافة</p>
          <button
            onClick={() => setShowEditModal(true)}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors border
              ${session.sales && session.sales.length > 0
                ? 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30'
                : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
              }`}
          >
            ✏️ تعديل
          </button>
        </div>

        {session.sales && session.sales.length > 0 ? (
          <div className="space-y-2">
            {session.sales.map((sale) => (
              <div
                key={sale.id}
                className="flex justify-between items-center bg-white/[0.03] p-3 rounded-lg border border-white/5"
              >
                <span className="text-gray-200 text-sm">{sale.products?.name}</span>
                <div className="text-left">
                  <span className="text-purple-400 text-xs block">
                    {sale.quantity} × {sale.products?.sell_price} ج
                  </span>
                  <span className="text-white text-xs font-bold">
                    {(sale.quantity * sale.products?.sell_price).toFixed(2)} ج
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-xs italic text-center py-4">
            لا توجد منتجات مضافة بعد
          </p>
        )}
      </div>

      {/* الإجمالي */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>وقت اللعب</span>
          <span>{sessionCost.toFixed(2)} ج</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>المنتجات</span>
          <span>{productsTotal.toFixed(2)} ج</span>
        </div>
        <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2">
          <span>الإجمالي</span>
          <span>{grandTotal.toFixed(2)} ج</span>
        </div>
      </div>

      {/* زرار إنهاء الجلسة */}
      <button
        onClick={handleEndSession}
        className="w-full py-3 bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors"
      >
        ◼ إنهاء الجلسة
      </button>

      {/* مودال التعديل */}
      {showEditModal && (
        <SummaryEditModal
          session={session}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

// ── SummaryEditModal ─────────────────────────────────────────
function SummaryEditModal({
  session,
  onClose,
}: {
  session: Session
  onClose: () => void
}) {
  const router = useRouter()
  const [localSales, setLocalSales] = useState<Sale[]>(session.sales ?? [])
  const [isSaving,   setIsSaving]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => setMounted(true), [])

  const originalSales = session.sales ?? []
  const hasChanges =
    localSales.length !== originalSales.length ||
    localSales.some((item) => {
      const orig = originalSales.find((s) => s.id === item.id)
      return !orig || orig.quantity !== item.quantity
    })

  const currentTotal = localSales.reduce(
    (sum, item) => sum + item.quantity * item.products.sell_price, 0
  )

  function handleIncrease(id: string) {
    setLocalSales(prev => prev.map(s => s.id === id ? { ...s, quantity: s.quantity + 1 } : s))
  }
  function handleDecrease(id: string) {
    setLocalSales(prev => {
      const item = prev.find(s => s.id === id)
      if (!item) return prev
      if (item.quantity <= 1) return prev.filter(s => s.id !== id)
      return prev.map(s => s.id === id ? { ...s, quantity: s.quantity - 1 } : s)
    })
  }
  function handleDelete(id: string) {
    setLocalSales(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      const deleted = originalSales.filter(o => !localSales.find(s => s.id === o.id))
      for (const item of deleted) {
        const r = await deleteSale(item.id, item.product_id, item.quantity)
        if (r.error) throw new Error(r.error)
      }
      for (const item of localSales) {
        const orig = originalSales.find(s => s.id === item.id)
        if (orig && orig.quantity !== item.quantity) {
          const r = await updateSaleQuantity(item.id, item.product_id, orig.quantity, item.quantity)
          if (r.error) throw new Error(r.error)
        }
      }
      router.refresh()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95"
      style={{ backdropFilter: 'blur(30px)' }}
    >
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" dir="rtl">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold">✏️ تعديل طلبات {session.devices?.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
          {localSales.length > 0 ? localSales.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">{item.products.name}</p>
                <p className="text-purple-400 text-xs">{item.products.sell_price} ج</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500 transition-colors">🗑️</button>
                <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/10">
                  <button onClick={() => handleDecrease(item.id)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded">-</button>
                  <span className="text-white text-sm min-w-[20px] text-center font-bold">{item.quantity}</span>
                  <button onClick={() => handleIncrease(item.id)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded">+</button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center py-10 text-gray-500 italic">لا توجد منتجات مضافة</p>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-purple-600/10 border border-purple-500/20 p-4 rounded-xl flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">الإجمالي:</span>
          <span className="text-white font-black text-xl">{currentTotal.toFixed(2)} ج</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={isSaving}
            className="flex-1 py-4 text-gray-400 bg-white/5 rounded-xl font-bold border border-white/5 disabled:opacity-50">
            إلغاء
          </button>
          {hasChanges && (
            <button onClick={handleSave} disabled={isSaving}
              className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50 transition-colors">
              {isSaving ? 'جاري الحفظ...' : '✅ حفظ التعديلات'}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
