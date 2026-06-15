// src/app/dashboard/pos/components/ActiveSessions.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateSaleQuantity, deleteSale } from '@/app/dashboard/actions/products'

type Sale = {
  id: string
  product_id: string
  quantity: number
  products: { id: string; name: string; sell_price: number }
}

type Session = {
  id: string
  start_time: string
  hourly_rate: number
  products_total: number
  // ✅ الحقلان الجديدان
  type: 'open' | 'limited'
  duration_minutes: number | null
  devices: { id: string; name: string; type: string }
  sales?: Sale[]
}

const deviceIcons: Record<string, string> = {
  PS5: '🎮', PS4: '🕹️', PC: '💻', VR: '🥽', Ping: '🏓',
}

// ─────────────────────────────────────────────────────────
// ✅ Hook التايمر الجديد — بيدعم تصاعدي وتنازلي
// ─────────────────────────────────────────────────────────
function useTimer(
  startTime: string,
  type: 'open' | 'limited',
  durationMinutes: number | null,
  onExpire?: () => void   // callback لما الوقت يخلص
) {
  const [elapsed, setElapsed] = useState(0)
  // ✅ useRef عشان نعرف إن الـ notification اترسلت قبل كده
  // من غير ref، كل re-render ممكن يبعت notification تاني
  const notifiedRef = useRef(false)

  useEffect(() => {
    const calc = () =>
      Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)

    setElapsed(calc())
    const id = setInterval(() => {
      const current = calc()
      setElapsed(current)

      // ✅ لو جلسة محدودة، نتحقق لو الوقت خلص
      if (type === 'limited' && durationMinutes) {
        const totalSeconds = durationMinutes * 60
        const remaining = totalSeconds - current

        // لما يفضل دقيقة واحدة → تحذير مبكر
        if (remaining === 60 && !notifiedRef.current) {
          sendNotification('⚠️ تحذير', 'باقي دقيقة واحدة على انتهاء الجلسة!')
        }

        // لما الوقت يخلص → إشعار نهائي
        if (remaining <= 0 && !notifiedRef.current) {
          notifiedRef.current = true
          sendNotification('🔴 انتهى الوقت', 'انتهت مدة الجلسة المحدودة!')
          onExpire?.()
        }
      }
    }, 1000)

    return () => clearInterval(id)
  }, [startTime, type, durationMinutes])

  // ✅ بنحسب الوقت اللي هيتعرض حسب نوع الجلسة
  if (type === 'limited' && durationMinutes) {
    const totalSeconds = durationMinutes * 60
    // remaining: الوقت المتبقي (0 كحد أدنى — مش بيوصل لسالب)
    const remaining = Math.max(0, totalSeconds - elapsed)
    const h = Math.floor(remaining / 3600)
    const m = Math.floor((remaining % 3600) / 60)
    const s = remaining % 60
    const display = h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return { display, remaining, isExpired: remaining <= 0 }
  }

  // تصاعدي للـ open sessions
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const display = h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return { display, remaining: null, isExpired: false }
}

// ✅ دالة إرسال Browser Notification
function sendNotification(title: string, body: string) {
  // لو المتصفح بيدعم Notification وعندنا إذن
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico', // أيقونة التطبيق
    })
  } else {
    // Fallback: لو مفيش إذن، نعمل console.warn
    // ممكن تضيف toast هنا لو عندك shadcn/ui
    console.warn(`${title}: ${body}`)
  }
}

// ─────────────────────────────────────────────────────────
// SessionDetailsModal — تعديل الطلبات وتحديث المخزون عبر Server Actions
// ─────────────────────────────────────────────────────────
function SessionDetailsModal({
  session,
  onClose,
}: {
  session: Session
  onClose: (updatedSales: Sale[]) => void
}) {
  const router = useRouter()

  // localSales = الحالة المؤقتة (المسودة) — مش بتتحفظ لحد ما يضغط حفظ
  const [localSales, setLocalSales] = useState<Sale[]>(session.sales ?? [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // هل فيه تغيير عن البيانات الأصلية؟ بيتحكم في ظهور زرار الحفظ
  const originalSales = session.sales ?? []
  const hasChanges =
    localSales.length !== originalSales.length ||
    localSales.some((item) => {
      const original = originalSales.find((s) => s.id === item.id)
      return !original || original.quantity !== item.quantity
    })

  // الإجمالي بيتحسب من الـ localSales مباشرة
  const currentTotal = localSales.reduce(
    (sum, item) => sum + item.quantity * item.products.sell_price,
    0
  )

  // ─────────────────────────────────────────────────────────
  // أزرار التعديل — بتغيّر الـ localSales بس (draft)
  // لا تلمس الـ DB لحد ما يضغط الكاشير حفظ
  // ─────────────────────────────────────────────────────────
  function handleIncrease(itemId: string) {
    setLocalSales((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, quantity: s.quantity + 1 } : s))
    )
  }

  function handleDecrease(itemId: string) {
    setLocalSales((prev) => {
      const item = prev.find((s) => s.id === itemId)
      if (!item) return prev
      if (item.quantity <= 1) return prev.filter((s) => s.id !== itemId)
      return prev.map((s) =>
        s.id === itemId ? { ...s, quantity: s.quantity - 1 } : s
      )
    })
  }

  function handleDelete(itemId: string) {
    setLocalSales((prev) => prev.filter((s) => s.id !== itemId))
  }

  // ─────────────────────────────────────────────────────────
  // handleSave — بيطبّق كل التغييرات دفعة واحدة على الـ DB
  // ─────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      // 1. احذف العناصر اللي اتشالت — هيا في الأصل بس مش في الـ localSales
      const deletedItems = originalSales.filter(
        (orig) => !localSales.find((s) => s.id === orig.id)
      )
      for (const item of deletedItems) {
        const result = await deleteSale(item.id, item.product_id, item.quantity)
        if (result.error) throw new Error(result.error)
      }

      // 2. عدّل العناصر اللي اتغيّرت كمياتها
      for (const item of localSales) {
        const original = originalSales.find((s) => s.id === item.id)
        if (original && original.quantity !== item.quantity) {
          const result = await updateSaleQuantity(
            item.id,
            item.product_id,
            original.quantity,
            item.quantity,
          )
          if (result.error) throw new Error(result.error)
        }
      }

      router.refresh()
      onClose(localSales)
    } catch (err: any) {
      setError(err.message ?? 'حدث خطأ غير متوقع')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95"
      style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}
    >
      <div
        className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span className="text-xl">{deviceIcons[session.devices?.type]}</span>
            تعديل طلبات {session.devices?.name}
          </h2>
          <button onClick={() => onClose(session.sales ?? [])} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
          {localSales.length > 0 ? localSales.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">{item.products.name}</p>
                <p className="text-purple-400 text-xs">{item.products.sell_price} ج</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
                <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => handleDecrease(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded"
                  >
                    -
                  </button>
                  <span className="text-white text-sm min-w-[20px] text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center py-10 text-gray-500 italic">لا توجد منتجات مضافة</p>
          )}
        </div>

        {/* رسالة خطأ لو فيه */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-right">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-purple-600/10 border border-purple-500/20 p-4 rounded-xl flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">الإجمالي:</span>
          <span className="text-white font-black text-xl">{currentTotal.toFixed(2)} ج</span>
        </div>

        <div className="flex gap-3">
          {/* إلغاء — بيغلق بدون حفظ */}
          <button
            onClick={() => onClose(session.sales ?? [])}
            disabled={isSaving}
            className="flex-1 py-4 text-gray-400 bg-white/5 rounded-xl font-bold border border-white/5 disabled:opacity-50"
          >
            إلغاء
          </button>

          {/* حفظ — بيظهر بس لو فيه تغيير */}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold active:scale-95 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'جاري الحفظ...' : '✅ حفظ التعديلات'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────
// ✅ SessionCard — مع التايمر الجديد
// ─────────────────────────────────────────────────────────
function SessionCard({
  session,
  isSelected,
  onSelect,
  onSalesUpdate,
}: {
  session: Session
  isSelected: boolean
  onSelect: () => void
  onSalesUpdate: (sessionId: string, updatedSales: Sale[]) => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [localSales, setLocalSales] = useState<Sale[]>(session.sales ?? [])
  const [localProductsTotal, setLocalProductsTotal] = useState(session.products_total ?? 0)
  const [isExpiredAlert, setIsExpiredAlert] = useState(false)

  const { display, remaining, isExpired } = useTimer(
    session.start_time,
    session.type ?? 'open',
    session.duration_minutes ?? null,
    () => setIsExpiredAlert(true)
  )

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(session.start_time).getTime()) / 1000
  )
  const sessionCost = parseFloat(
    ((elapsedSeconds / 3600) * session.hourly_rate).toFixed(2)
  )

  // ✅ لما المودال يحفظ: حدّث الكارد وبلّغ الـ POSLayout بالتغيير
  function handleModalClose(updatedSales: Sale[]) {
    const newTotal = updatedSales.reduce(
      (sum, item) => sum + item.quantity * item.products.sell_price,
      0
    )
    setLocalSales(updatedSales)
    setLocalProductsTotal(parseFloat(newTotal.toFixed(2)))
    setShowDetails(false)
    // ✅ هنا بيوصل التغيير للـ POSLayout عشان OrderSummaryColumn يتحدث
    onSalesUpdate(session.id, updatedSales)
  }

  return (
    <>
      <div
        onClick={onSelect}
        className={`
          w-full text-right p-5 rounded-2xl border cursor-pointer transition-all
          ${isExpiredAlert
            ? 'border-red-500/60 bg-red-500/10 animate-pulse'   // ✅ وميض أحمر لما الوقت يخلص
            : localProductsTotal > 0
              ? 'border-purple-500/30 bg-purple-500/[0.03]'
              : 'border-white/5 bg-white/[0.02]'
          }
          ${isSelected ? 'ring-2 ring-purple-500 bg-purple-600/10' : ''}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-white font-bold">
            {deviceIcons[session.devices?.type]} {session.devices?.name}
          </span>

          {/* ✅ التايمر مع لون مختلف حسب النوع والحالة */}
          <span
            className={`
              px-3 py-1 rounded-xl text-xs font-mono font-bold
              ${isExpiredAlert
                ? 'bg-red-500/30 text-red-400'          // خلص الوقت → أحمر
                : session.type === 'limited' && remaining !== null && remaining < 300
                  ? 'bg-orange-500/20 text-orange-400'  // أقل من 5 دقائق → برتقالي
                  : session.type === 'limited'
                    ? 'bg-blue-500/20 text-blue-400'    // تنازلي → أزرق
                    : 'bg-purple-500/20 text-purple-300' // تصاعدي → بنفسجي
              }
            `}
          >
            {/* أيقونة صغيرة تبيّن نوع التايمر */}
            {session.type === 'limited' ? '⬇️ ' : '⬆️ '}
            {isExpiredAlert ? '00:00 ⚠️' : display}
          </span>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-2 text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              الحساب الحالي
            </p>
            <p className="text-2xl font-black text-white">
              {(sessionCost + localProductsTotal).toFixed(2)}{' '}
              <span className="text-xs text-gray-500 font-normal italic">ج</span>
            </p>
          </div>

          <div className="text-left space-y-2">
            {/* ✅ تنبيه انتهاء الوقت */}
            {isExpiredAlert && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold mb-1">
                🔴 انتهى الوقت!
              </div>
            )}
            {/* زرار الطلبات يظهر دايماً — حتى لو مفيش منتجات، الكاشير يقدر يضيف */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails(true) }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors
                ${ localProductsTotal > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'
                }`}
            >
              {localProductsTotal > 0
                ? `✏️ الطلبات (${localProductsTotal.toFixed(2)})`
                : '✏️ الطلبات'}
            </button>
            <p className="text-[10px] text-gray-500 mt-2">
              وقت: {sessionCost.toFixed(2)} ج
            </p>
          </div>
        </div>
      </div>

      {showDetails && (
        <SessionDetailsModal
          session={{ ...session, sales: localSales }}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// ActiveSessions — المكوّن الرئيسي
// ─────────────────────────────────────────────────────────
export default function ActiveSessions({
  sessions,
  selectedSessionId,
  onSelect,
  onSalesUpdate,
}: {
  sessions: Session[]
  selectedSessionId: string | null
  onSelect: (id: string) => void
  onSalesUpdate: (sessionId: string, updatedSales: Sale[]) => void
}) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 italic bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
        لا توجد جلسات نشطة
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isSelected={selectedSessionId === session.id}
          onSelect={() => onSelect(session.id)}
          onSalesUpdate={onSalesUpdate}
        />
      ))}
    </div>
  )
}