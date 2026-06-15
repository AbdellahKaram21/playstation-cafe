'use client'
// ============================================================
// FILE: src/app/dashboard/pos/components/POSLayout.tsx
// الـ layout الرئيسي للـ POS — بيوزع الـ 3 أعمدة
// ============================================================

import { useState, useEffect }  from 'react'
import ActiveSessions            from './ActiveSessions'
import ProductGrid               from './ProductGrid'
import RealtimeSync              from './RealtimeSync'
import OrderSummaryColumn        from './OrderSummaryColumn'
import type { Session }          from './OrderSummaryColumn'
import type { Product }          from '@/types/database.types'

type Props = {
  sessions: Session[]
  products: Product[]
}

export default function POSLayout({ sessions: initialSessions, products }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessions.length === 1 ? initialSessions[0].id : null
  )

  const selectedSession = sessions.find(s => s.id === selectedSessionId) ?? null

  // لما initialSessions تتغير بعد router.refresh() من RealtimeSync
  useEffect(() => {
    setSessions(initialSessions)
    setSelectedSessionId(prev => {
      if (!prev) return null
      const stillExists = initialSessions.some(s => s.id === prev)
      return stillExists ? prev : null
    })
  }, [initialSessions])

  // لما SessionCard يحفظ تعديلات المبيعات — نحدّث الـ local state
  function handleSalesUpdate(sessionId: string, updatedSales: Session['sales']) {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s
        const newTotal = (updatedSales ?? []).reduce(
          (sum, item) => sum + item.quantity * item.products.sell_price, 0
        )
        return {
          ...s,
          sales:          updatedSales,
          products_total: parseFloat(newTotal.toFixed(2)),
        }
      })
    )
  }

  return (
    <div dir="rtl">

      {/* RealtimeSync — مخفي، بيراقب sessions ويعمل refresh تلقائي */}
      <RealtimeSync />

      {/* ══════════════════════════════════════════
          MOBILE — عمود واحد
          ══════════════════════════════════════════ */}
      <div className="flex flex-col gap-5 lg:hidden">

        <div>
          <h2 className="text-xs text-gray-400 font-medium mb-3">
            🟢 الجلسات النشطة ({sessions.length})
          </h2>
          {sessions.length > 0 ? (
            <ActiveSessions
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelect={setSelectedSessionId}
              onSalesUpdate={handleSalesUpdate}
            />
          ) : (
            <NoSessionsBanner />
          )}
        </div>

        <div>
          <h2 className="text-xs text-gray-400 font-medium mb-3">🧾 الطلب الحالي</h2>
          <OrderSummaryColumn session={selectedSession} />
        </div>

        <div>
          <h2 className="text-xs text-gray-400 font-medium mb-3">🛍️ المنتجات المتاحة</h2>
          <ProductGrid
            products={products}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
          />
        </div>

      </div>

      {/* ══════════════════════════════════════════
          DESKTOP — 3 أعمدة
          ══════════════════════════════════════════ */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: '1fr 1.2fr 1.8fr',
          gap:     '12px',
          padding: '12px',
          height:  'calc(100vh - 72px)',
        }}
      >
        {/* العمود الأول — الجلسات */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-xs text-gray-400 font-medium mb-3 shrink-0">
            🟢 الجلسات النشطة ({sessions.length})
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sessions.length > 0 ? (
              <ActiveSessions
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelect={setSelectedSessionId}
                onSalesUpdate={handleSalesUpdate}
              />
            ) : (
              <NoSessionsBanner />
            )}
          </div>
        </div>

        {/* العمود الثاني — ملخص الطلب */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-xs text-gray-400 font-medium mb-3 shrink-0">
            🧾 الطلب الحالي
          </h2>
          <OrderSummaryColumn session={selectedSession} />
        </div>

        {/* العمود الثالث — المنتجات */}
        <div className="flex flex-col min-h-0">
          <h2 className="text-xs text-gray-400 font-medium mb-3 shrink-0">
            🛍️ المنتجات المتاحة
          </h2>
          <ProductGrid
            products={products}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
          />
        </div>

      </div>
    </div>
  )
}

// ── NoSessionsBanner ─────────────────────────────────────────
function NoSessionsBanner() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
      <p className="text-3xl mb-2">🎮</p>
      <p className="text-sm text-gray-400 font-medium">لا توجد جلسات نشطة</p>
      <p className="text-xs text-gray-600 mt-1">
        ابدأ جلسة من صفحة الأجهزة وستظهر هنا تلقائياً
      </p>
    </div>
  )
}
