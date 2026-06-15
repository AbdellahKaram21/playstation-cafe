'use client'
// ============================================================
// FILE: src/app/dashboard/reports/components/ReportsTabs.tsx
//
// بيستخدم recharts لعمل charts حقيقية interactive
// recharts: مكتبة charts لـ React — بتبني charts بـ components
// ============================================================

import { useState } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────
type DayData = {
  label:   string
  date:    string
  revenue: number
  count:   number
  isToday?: boolean
}

type TopProduct = {
  name:     string
  category: string
  qty:      number
  revenue:  number
}

type DeviceStat = {
  id:           string
  name:         string
  type:         string
  sessionCount: number
  revenue:      number
  totalMinutes: number
}

type SessionRow = {
  id:               string
  end_time:         string | null
  duration_minutes: number | null
  session_price:    number | null
  products_total:   number | null
  total_price:      number | null
  device:           { name: string; type: string } | null
}

type InventoryItem = {
  id:         string
  name:       string
  category:   string
  quantity:   number
  sell_price: number
}

type InventoryData = {
  outOfStock:   InventoryItem[]
  lowStock:     InventoryItem[]
  healthyCount: number
  totalValue:   number
  totalActive:  number
}

type Props = {
  last7Days:            DayData[]
  last30Days:           DayData[]
  topProducts:          TopProduct[]
  deviceStats:          DeviceStat[]
  recentSessions:       SessionRow[]
  monthProductsRevenue: number
  inventory:            InventoryData
}

// ── Constants ─────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'نظرة عامة', icon: '📊' },
  { id: 'sessions',  label: 'الجلسات',   icon: '🎮' },
  { id: 'devices',   label: 'الأجهزة',   icon: '🖥️' },
  { id: 'products',  label: 'المنتجات',  icon: '📦' },
  { id: 'inventory', label: 'المخزون',   icon: '🗃️' },
]

const deviceIcons: Record<string, string> = {
  PS5: '🎮', PS4: '🕹️', PC: '💻', VR: '🥽', Ping: '🏓',
}

// ── Tooltip مخصص للـ Chart ────────────────────────────────────
// recharts بتسمحلك تعمل tooltip بتصميمك الخاص بدل الافتراضي
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-right">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-purple-300">
        {payload[0]?.value?.toFixed(0)} ج
      </p>
      {payload[1] && (
        <p className="text-xs text-gray-400">{payload[1]?.value} جلسة</p>
      )}
    </div>
  )
}

// ── المكوّن الرئيسي ────────────────────────────────────────────
export default function ReportsTabs({
  last7Days, last30Days,
  topProducts, deviceStats,
  recentSessions, monthProductsRevenue, inventory,
}: Props) {

  const [activeTab,    setActiveTab]    = useState<'overview' | 'sessions' | 'devices' | 'products' | 'inventory'>('overview')
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('month')
  const [chartRange,   setChartRange]   = useState<'7' | '30'>('7')

  // ── فلترة الجلسات بالفترة ─────────────────────────────────
  const now        = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0)

  const filteredSessions = recentSessions.filter(s => {
    if (!s.end_time) return false
    const d = new Date(s.end_time)
    if (periodFilter === 'today') return d >= todayStart
    if (periodFilter === 'week')  return d >= weekStart
    return true
  })

  const filteredRevenue = filteredSessions.reduce((sum, s) => sum + (s.total_price ?? 0), 0)

  // بيانات الـ chart حسب النطاق المختار (7 أيام أو 30 يوم)
  const chartData = chartRange === '7' ? last7Days : last30Days

  // تحذيرات المخزون
  const inventoryAlerts = inventory.outOfStock.length + inventory.lowStock.length

  // ── PeriodFilter Component (زرار الفلتر المشترك) ──────────
  const PeriodFilter = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 shrink-0">عرض:</span>
      {(['today', 'week', 'month'] as const).map(p => (
        <button
          key={p}
          onClick={() => setPeriodFilter(p)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all
            ${periodFilter === p
              ? 'bg-purple-600/20 border-purple-500/30 text-purple-300'
              : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
            }`}
        >
          {p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : 'الشهر'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">

      {/* ── Tab Buttons ──────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-white/5 pb-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0
              ${activeTab === tab.id
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'inventory' && inventoryAlerts > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full
                               text-[9px] text-white flex items-center justify-center font-bold">
                {inventoryAlerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: نظرة عامة
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* Chart الإيرادات */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5">

            {/* Header الـ chart + زراير النطاق */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white">الإيرادات</h3>
              <div className="flex gap-1.5">
                {(['7', '30'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all
                      ${chartRange === r
                        ? 'bg-purple-600/20 border-purple-500/30 text-purple-300'
                        : 'border-white/10 text-gray-500 hover:text-white'
                      }`}
                  >
                    {r} أيام
                  </button>
                ))}
              </div>
            </div>

            {/* AreaChart من recharts
                ResponsiveContainer: بيخلي الـ chart يتمدد مع حجم الشاشة
                AreaChart: chart بيه منطقة ملونة تحت الخط
                Area: الخط + المنطقة الملونة نفسها
                XAxis: محور X (التواريخ)
                YAxis: محور Y (الإيرادات) — بنخفيه عشان المساحة
                CartesianGrid: الشبكة الخلفية
                Tooltip: الـ popup اللي بيظهر لما تحوم على نقطة
            */}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {/* gradient: تدرج اللون تحت الخط */}
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  // على الشاشات الصغيرة نعرض نقطة كل 3 أيام عشان ما يتزاحمش
                  interval={chartRange === '30' ? 4 : 0}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#9333ea', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* مصادر الإيراد */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5">
            <h3 className="text-sm font-semibold text-white mb-4">مصادر الإيراد هذا الشهر</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
                <p className="text-2xl font-black text-purple-300">
                  {recentSessions.reduce((s, r) => s + (r.session_price ?? 0), 0).toFixed(0)} ج
                </p>
                <p className="text-xs text-gray-400 mt-1">إيرادات الجلسات</p>
              </div>
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                <p className="text-2xl font-black text-green-300">
                  {monthProductsRevenue.toFixed(0)} ج
                </p>
                <p className="text-xs text-gray-400 mt-1">إيرادات المنتجات</p>
              </div>
            </div>
          </div>

          {/* تحذير مخزون */}
          {inventoryAlerts > 0 && (
            <div
              onClick={() => setActiveTab('inventory')}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-4
                         flex items-center gap-3 cursor-pointer hover:bg-red-500/10 transition-colors"
            >
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">تحذير: مشاكل في المخزون</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {inventory.outOfStock.length > 0 && `${inventory.outOfStock.length} منتج نفد • `}
                  {inventory.lowStock.length > 0   && `${inventory.lowStock.length} منتج قارب النفاد`}
                </p>
              </div>
              <span className="text-gray-500 text-xs shrink-0">عرض ◀</span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: الجلسات
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">

          {/* فلتر الفترة */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodFilter />
            <span className="text-xs text-gray-400">
              الإجمالي:{' '}
              <span className="text-white font-bold">{filteredRevenue.toFixed(0)} ج</span>
              <span className="text-gray-600 mr-1">({filteredSessions.length} جلسة)</span>
            </span>
          </div>

          {/* جدول الجلسات */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">🎮</p>
                <p className="text-sm text-gray-400">لا توجد جلسات في هذه الفترة</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 md:px-5 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/20
                                      flex items-center justify-center text-sm shrink-0">
                        {deviceIcons[s.device?.type ?? ''] ?? '🎮'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {s.device?.name ?? 'جهاز غير معروف'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.end_time
                            ? new Date(s.end_time).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
                              + ' — '
                              + new Date(s.end_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-left">
                      {s.duration_minutes != null && (
                        <div className="hidden sm:block text-center">
                          <p className="text-xs font-bold text-gray-300">{s.duration_minutes} د</p>
                          <p className="text-[10px] text-gray-600">المدة</p>
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{(s.total_price ?? 0).toFixed(0)} ج</p>
                        {s.products_total != null && s.products_total > 0 && (
                          <p className="text-[10px] text-gray-500">منتجات: {s.products_total.toFixed(0)} ج</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: الأجهزة (جديد!)
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'devices' && (
        <div className="space-y-4">

          {/* Bar Chart للأجهزة */}
          {deviceStats.some(d => d.revenue > 0) && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5">
              <h3 className="text-sm font-semibold text-white mb-4">إيرادات الأجهزة هذا الشهر</h3>

              {/* BarChart: شكل عمودي بدل الـ Area
                  Bar: كل عمود = جهاز واحد
                  radius: لتدوير زوايا الأعمدة
              */}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={deviceStats.filter(d => d.revenue > 0)}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#9333ea" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* قائمة الأجهزة التفصيلية */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-4 md:px-5 py-3 border-b border-white/5">
              <p className="text-sm font-semibold text-white">تفاصيل الأجهزة — هذا الشهر</p>
            </div>

            {deviceStats.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-4xl mb-3">🖥️</p>
                <p className="text-sm text-gray-400">لا توجد أجهزة</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {deviceStats.map((device, i) => {
                  const maxRevenue = deviceStats[0]?.revenue || 1
                  const pct        = (device.revenue / maxRevenue) * 100
                  const avgMin     = device.sessionCount > 0
                    ? Math.round(device.totalMinutes / device.sessionCount)
                    : 0

                  return (
                    <div key={device.id} className="px-4 md:px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* الترتيب */}
                          <span className={`text-sm font-black w-6 shrink-0 text-left
                            ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-500' : 'text-gray-600'}`}>
                            {i + 1}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/20
                                          flex items-center justify-center text-lg shrink-0">
                            {deviceIcons[device.type] ?? '🎮'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{device.name}</p>
                            <p className="text-xs text-gray-500">{device.type}</p>
                          </div>
                        </div>

                        {/* الإحصائيات */}
                        <div className="flex items-center gap-4 shrink-0 text-left">
                          <div className="hidden sm:block text-center">
                            <p className="text-xs font-bold text-gray-300">{device.sessionCount}</p>
                            <p className="text-[10px] text-gray-600">جلسة</p>
                          </div>
                          <div className="hidden sm:block text-center">
                            <p className="text-xs font-bold text-gray-300">{avgMin} د</p>
                            <p className="text-[10px] text-gray-600">متوسط</p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-white">{device.revenue.toFixed(0)} ج</p>
                            <p className="text-[10px] text-gray-500">{device.sessionCount} جلسة</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500/50 rounded-full transition-all duration-500"
                          style={{ width: `${device.revenue > 0 ? Math.max(pct, 2) : 0}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: المنتجات
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="px-4 md:px-5 py-3 border-b border-white/5">
            <p className="text-sm font-semibold text-white">أكثر المنتجات مبيعاً — هذا الشهر</p>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm text-gray-400">لا توجد مبيعات منتجات هذا الشهر</p>
            </div>
          ) : (
            <>
              {/* Bar Chart للمنتجات */}
              <div className="p-4 border-b border-white/5">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={topProducts}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#22c55e" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* قائمة تفصيلية */}
              <div className="divide-y divide-white/5">
                {topProducts.map((p, i) => {
                  const maxRevenue = topProducts[0].revenue || 1
                  const pct = (p.revenue / maxRevenue) * 100
                  return (
                    <div key={p.name} className="px-4 md:px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-sm font-black w-6 shrink-0 text-left
                            ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-500' : 'text-gray-600'}`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.category}</p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-sm font-bold text-white">{p.revenue.toFixed(0)} ج</p>
                          <p className="text-xs text-gray-500">{p.qty} قطعة</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500/50 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: المخزون
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">

          {/* بطاقات ملخص */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'إجمالي المنتجات', value: inventory.totalActive,      color: 'purple', icon: '📦' },
              { label: 'مخزون سليم',       value: inventory.healthyCount,     color: 'green',  icon: '✅' },
              { label: 'قارب النفاد',       value: inventory.lowStock.length,  color: 'yellow', icon: '⚠️' },
              { label: 'نفد من المخزون',   value: inventory.outOfStock.length, color: 'red',    icon: '🔴' },
            ].map(card => (
              <div key={card.label} className={`rounded-xl border p-3 text-center
                ${card.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' : ''}
                ${card.color === 'green'  ? 'border-green-500/20  bg-green-500/5'  : ''}
                ${card.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' : ''}
                ${card.color === 'red'    ? 'border-red-500/20    bg-red-500/5'    : ''}
              `}>
                <span className="text-xl">{card.icon}</span>
                <p className={`text-2xl font-black mt-1
                  ${card.color === 'purple' ? 'text-purple-300' : ''}
                  ${card.color === 'green'  ? 'text-green-300'  : ''}
                  ${card.color === 'yellow' ? 'text-yellow-300' : ''}
                  ${card.color === 'red'    ? 'text-red-300'    : ''}
                `}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* قيمة المخزون */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">إجمالي قيمة المخزون (بسعر الشراء)</p>
              <p className="text-2xl font-black text-white mt-1">{inventory.totalValue.toFixed(0)} ج</p>
            </div>
            <span className="text-4xl">💰</span>
          </div>

          {/* المنتجات النافدة */}
          {inventory.outOfStock.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-500/10 flex items-center gap-2">
                <span className="text-red-400 text-sm">🔴</span>
                <p className="text-sm font-semibold text-red-300">
                  نفد من المخزون ({inventory.outOfStock.length})
                </p>
              </div>
              <div className="divide-y divide-red-500/10">
                {inventory.outOfStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category || 'بدون تصنيف'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black text-red-400">0</p>
                      <p className="text-xs text-gray-600">قطعة</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المنتجات القاربة النفاد */}
          {inventory.lowStock.length > 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-yellow-500/10 flex items-center gap-2">
                <span className="text-yellow-400 text-sm">⚠️</span>
                <p className="text-sm font-semibold text-yellow-300">
                  قارب النفاد ({inventory.lowStock.length})
                </p>
              </div>
              <div className="divide-y divide-yellow-500/10">
                {inventory.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category || 'بدون تصنيف'}</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-lg font-black ${p.quantity <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {p.quantity}
                      </p>
                      <p className="text-xs text-gray-600">قطعة</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المخزون كله تمام */}
          {inventory.outOfStock.length === 0 && inventory.lowStock.length === 0 && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm font-semibold text-green-300">المخزون في حالة ممتازة</p>
              <p className="text-xs text-gray-500 mt-1">كل المنتجات لديها كمية كافية</p>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
