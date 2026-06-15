// ============================================================
// FILE: src/app/dashboard/reports/page.tsx
// Server Component — بيجيب كل البيانات ويمررها لـ ReportsTabs
// ============================================================

import { createClient } from '@/lib/supabase/server'
import ReportsTabs from './components/ReportsTabs'

export default async function ReportsPage() {
  const supabase = await createClient()

  const now = new Date()

  // ── تعريف الفترات الزمنية ─────────────────────────────────
  const todayStart    = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart     = new Date(now); weekStart.setDate(now.getDate() - 6);   weekStart.setHours(0, 0, 0, 0)
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1)

  // الأسبوع اللي فات — لحساب % التغيير
  const prevWeekStart = new Date(now); prevWeekStart.setDate(now.getDate() - 13); prevWeekStart.setHours(0, 0, 0, 0)
  const prevWeekEnd   = new Date(now); prevWeekEnd.setDate(now.getDate() - 7);   prevWeekEnd.setHours(23, 59, 59, 999)

  // الشهر اللي فات — لحساب % التغيير
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // ── جلسات الشهر الحالي المنتهية ──────────────────────────
  const { data: monthSessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, duration_minutes,
      session_price, products_total, total_price, device_id,
      devices ( id, name, type )
    `)
    .eq('status', 'ended')
    .gte('end_time', monthStart.toISOString())
    .order('end_time', { ascending: false })

  // ── جلسات الشهر اللي فات (للمقارنة) ─────────────────────
  const { data: prevMonthSessions } = await supabase
    .from('sessions')
    .select('id, total_price, end_time')
    .eq('status', 'ended')
    .gte('end_time', prevMonthStart.toISOString())
    .lte('end_time', prevMonthEnd.toISOString())

  // ── مبيعات المنتجات في الشهر الحالي ──────────────────────
  const { data: monthSales } = await supabase
    .from('sales')
    .select('id, quantity, total, created_at, products ( name, category )')
    .gte('created_at', monthStart.toISOString())

  // ── بيانات المخزون ────────────────────────────────────────
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, category, quantity, sell_price, buy_price, is_active')
    .order('quantity', { ascending: true })

  // ── كل الأجهزة ───────────────────────────────────────────
  const { data: allDevices } = await supabase
    .from('devices')
    .select('id, name, type')
    .eq('is_deleted', false)

  // ============================================================
  // حسابات الإحصائيات
  // ============================================================

  const allMonth  = monthSessions ?? []
  const todaySess = allMonth.filter(s => s.end_time && new Date(s.end_time) >= todayStart)
  const weekSess  = allMonth.filter(s => s.end_time && new Date(s.end_time) >= weekStart)
  const prevWeekSess = (prevMonthSessions ?? []).filter(s =>
    s.end_time &&
    new Date(s.end_time) >= prevWeekStart &&
    new Date(s.end_time) <= prevWeekEnd
  )

  const todayRevenue    = todaySess.reduce((sum, s) => sum + (s.total_price ?? 0), 0)
  const weekRevenue     = weekSess.reduce((sum, s)  => sum + (s.total_price ?? 0), 0)
  const monthRevenue    = allMonth.reduce((sum, s)  => sum + (s.total_price ?? 0), 0)
  const prevMonthRevenue = (prevMonthSessions ?? []).reduce((sum, s) => sum + (s.total_price ?? 0), 0)
  const prevWeekRevenue = prevWeekSess.reduce((sum, s) => sum + (s.total_price ?? 0), 0)

  const avgDuration = allMonth.length
    ? Math.round(allMonth.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / allMonth.length)
    : 0

  const monthProductsRevenue = (monthSales ?? []).reduce((sum, s) => sum + (s.total ?? 0), 0)

  // ── حساب % التغيير ───────────────────────────────────────
  // calcChange: بيحسب نسبة التغيير بين فترتين
  // مثال: الأسبوع ده 500 ج، الأسبوع اللي فات 400 ج → +25%
  function calcChange(current: number, previous: number): number | null {
    if (previous === 0) return null          // مش ممكن نقسم على صفر
    return Math.round(((current - previous) / previous) * 100)
  }

  const weekChange  = calcChange(weekRevenue,  prevWeekRevenue)
  const monthChange = calcChange(monthRevenue, prevMonthRevenue)

  // ── آخر 30 يوم للرسم البياني ─────────────────────────────
  // بنبني مصفوفة فيها كل يوم من آخر 30 يوم مع إيراداته
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d    = new Date(now); d.setDate(now.getDate() - (29 - i)); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(d.getDate() + 1)

    // جلسات هذا اليوم
    const daySess = allMonth.filter(s =>
      s.end_time && new Date(s.end_time) >= d && new Date(s.end_time) < next
    )

    return {
      label:   d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }),
      date:    d.toISOString(),
      revenue: daySess.reduce((sum, s) => sum + (s.total_price ?? 0), 0),
      count:   daySess.length,
    }
  })

  // آخر 7 أيام فقط (للعرض المختصر)
  const last7Days = last30Days.slice(-7).map((d, i, arr) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'short' }),
    isToday: i === arr.length - 1,
  }))

  // ── أكثر المنتجات مبيعاً ──────────────────────────────────
  const productMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {}
  for (const sale of monthSales ?? []) {
    const name = (sale.products as any)?.name     ?? 'غير معروف'
    const cat  = (sale.products as any)?.category ?? 'بدون تصنيف'
    if (!productMap[name]) productMap[name] = { name, category: cat, qty: 0, revenue: 0 }
    productMap[name].qty     += sale.quantity
    productMap[name].revenue += sale.total
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── إحصائيات الأجهزة ─────────────────────────────────────
  // بنحسب لكل جهاز: عدد الجلسات + إجمالي الإيراد + متوسط المدة
  const deviceStatsMap: Record<string, {
    id: string; name: string; type: string
    sessionCount: number; revenue: number; totalMinutes: number
  }> = {}

  // أنشئ entry لكل جهاز موجود (حتى لو ما عملش جلسات)
  for (const device of allDevices ?? []) {
    deviceStatsMap[device.id] = {
      id:           device.id,
      name:         device.name,
      type:         device.type,
      sessionCount: 0,
      revenue:      0,
      totalMinutes: 0,
    }
  }

  // اجمع بيانات الجلسات على الأجهزة
  for (const session of allMonth) {
    const deviceId = session.device_id
    if (deviceId && deviceStatsMap[deviceId]) {
      deviceStatsMap[deviceId].sessionCount += 1
      deviceStatsMap[deviceId].revenue      += session.total_price   ?? 0
      deviceStatsMap[deviceId].totalMinutes += session.duration_minutes ?? 0
    }
  }

  const deviceStats = Object.values(deviceStatsMap)
    .sort((a, b) => b.revenue - a.revenue)  // رتب تنازلياً حسب الإيراد

  // ── بيانات المخزون ────────────────────────────────────────
  const activeProducts = (allProducts ?? []).filter(p => p.is_active)
  const outOfStock     = activeProducts.filter(p => p.quantity === 0)
  const lowStock       = activeProducts.filter(p => p.quantity > 0 && p.quantity <= 5)
  const healthyStock   = activeProducts.filter(p => p.quantity > 5)
  const inventoryValue = activeProducts.reduce((sum, p) => sum + p.quantity * p.buy_price, 0)

  // ── بطاقات الملخص ─────────────────────────────────────────
  const summaryCards = [
    {
      label:  'إيرادات اليوم',
      value:  `${todayRevenue.toFixed(0)} ج`,
      sub:    `${todaySess.length} جلسة`,
      color:  'purple',
      icon:   '📅',
      change: null,                   // اليوم مش بنقارنه
    },
    {
      label:  'إيرادات الأسبوع',
      value:  `${weekRevenue.toFixed(0)} ج`,
      sub:    `${weekSess.length} جلسة`,
      color:  'blue',
      icon:   '📆',
      change: weekChange,             // مقارنة بالأسبوع اللي فات
    },
    {
      label:  'إيرادات الشهر',
      value:  `${monthRevenue.toFixed(0)} ج`,
      sub:    `${allMonth.length} جلسة`,
      color:  'green',
      icon:   '🗓️',
      change: monthChange,            // مقارنة بالشهر اللي فات
    },
    {
      label:  'متوسط مدة الجلسة',
      value:  `${avgDuration} د`,
      sub:    'هذا الشهر',
      color:  'yellow',
      icon:   '⏱️',
      change: null,
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl pt-10 lg:pt-0" dir="rtl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">التقارير والإحصائيات</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className={`rounded-xl border p-3 md:p-4
            ${card.color === 'purple' ? 'border-purple-500/20 bg-purple-500/5' : ''}
            ${card.color === 'blue'   ? 'border-blue-500/20   bg-blue-500/5'   : ''}
            ${card.color === 'green'  ? 'border-green-500/20  bg-green-500/5'  : ''}
            ${card.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' : ''}
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
              {/* % التغيير — يظهر بس لو عندنا بيانات مقارنة */}
              {card.change !== null ? (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md
                  ${card.change >= 0
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                  }`}>
                  {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}%
                </span>
              ) : (
                <span className="text-xs text-gray-500">{card.sub}</span>
              )}
            </div>
            <p className={`text-xl md:text-2xl font-bold mb-1
              ${card.color === 'purple' ? 'text-purple-300' : ''}
              ${card.color === 'blue'   ? 'text-blue-300'   : ''}
              ${card.color === 'green'  ? 'text-green-300'  : ''}
              ${card.color === 'yellow' ? 'text-yellow-300' : ''}
            `}>{card.value}</p>
            <p className="text-xs text-gray-400">{card.label}</p>
            {card.change !== null && (
              <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ReportsTabs
        last7Days={last7Days}
        last30Days={last30Days}
        topProducts={topProducts}
        deviceStats={deviceStats}
        recentSessions={allMonth.slice(0, 50).map(s => ({
          id:               s.id,
          end_time:         s.end_time,
          duration_minutes: s.duration_minutes,
          session_price:    s.session_price,
          products_total:   s.products_total,
          total_price:      s.total_price,
          device:           s.devices as { name: string; type: string } | null,
        }))}
        monthProductsRevenue={monthProductsRevenue}
        inventory={{
          outOfStock:   outOfStock.map(p => ({ id: p.id, name: p.name, category: p.category ?? '', quantity: p.quantity, sell_price: p.sell_price })),
          lowStock:     lowStock.map(p =>    ({ id: p.id, name: p.name, category: p.category ?? '', quantity: p.quantity, sell_price: p.sell_price })),
          healthyCount: healthyStock.length,
          totalValue:   inventoryValue,
          totalActive:  activeProducts.length,
        }}
      />

    </div>
  )
}
