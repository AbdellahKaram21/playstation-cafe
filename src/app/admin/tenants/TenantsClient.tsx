'use client'
// ============================================================
// FILE: src/app/admin/tenants/TenantsClient.tsx
// ============================================================

import { useState, useMemo } from 'react'
import Link                  from 'next/link'
import { useRouter }         from 'next/navigation'
import { softDeleteTenant }  from '../actions'

type Subscription = {
  plan:       string
  status:     string
  start_date: string
  end_date:   string | null
} | null

type TenantRow = {
  id:           string
  name:         string
  plan:         string
  status:       string
  created_at:   string
  userCount:    number
  deviceCount:  number
  subscription: Subscription
}

type FilterStatus = 'all' | 'active' | 'suspended' | 'pending'
type FilterPlan   = 'all' | 'normal' | 'pro' | 'enterprise'

interface Props { tenants: TenantRow[] }

export default function TenantsClient({ tenants }: Props) {
  const router = useRouter()

  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPlan,   setFilterPlan]   = useState<FilterPlan>('all')
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = search.trim() === ''
        || t.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus
      const planValue     = t.plan === 'free' ? 'normal' : t.plan
      const matchesPlan   = filterPlan === 'all' || planValue === filterPlan
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [tenants, search, filterStatus, filterPlan])

  const totalCount     = tenants.length
  const activeCount    = tenants.filter(t => t.status === 'active').length
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length
  const pendingCount   = tenants.filter(t => t.status === 'pending').length

  function planBadge(plan: string) {
    if (plan === 'enterprise') return { label: '⭐ Enterprise', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
    if (plan === 'pro')        return { label: '💜 Pro',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/20' }
    return                            { label: 'Normal',        cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   }
  }

  function statusBadge(status: string) {
    if (status === 'active')    return { label: 'نشط',     cls: 'bg-green-500/15  text-green-400  border-green-500/20'  }
    if (status === 'pending')   return { label: 'معلق ⏳',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
    return                             { label: 'موقوف',   cls: 'bg-red-500/15    text-red-400    border-red-500/20'    }
  }

  async function handleDelete(e: React.MouseEvent, tenantId: string, tenantName: string) {
    e.preventDefault()
    e.stopPropagation()

    const ok = confirm(`⚠️ حذف "${tenantName}"؟\n\nالبيانات التاريخية هتفضل محفوظة.`)
    if (!ok) return

    setDeletingId(tenantId)
    try {
      const result = await softDeleteTenant(tenantId)
      if (result.error) { alert(result.error) }
      else { router.refresh() }
    } catch {
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setDeletingId(null)
    }
  }

  const hasActiveFilters = search !== '' || filterStatus !== 'all' || filterPlan !== 'all'

  return (
    <div className="space-y-6 max-w-6xl" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">إدارة الكافيهات 🏪</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount} كافيه مسجل — {activeCount} نشط
            {pendingCount > 0 && (
              <span className="text-yellow-400 mr-2">— {pendingCount} في الانتظار ⏳</span>
            )}
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-purple-600 hover:bg-purple-700 text-white transition-all"
        >
          <span>+</span><span>كافيه جديد</span>
        </Link>
      </div>

      {/* تنبيه الطلبات المعلقة */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl
                        bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-2xl">⏳</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-300">
              {pendingCount} طلب تسجيل في انتظار موافقتك
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              اضغط على أي كافيه معلق لمراجعة بياناته والموافقة عليه
            </p>
          </div>
          <button
            onClick={() => setFilterStatus('pending')}
            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors
                       border border-yellow-500/30 px-3 py-1.5 rounded-lg shrink-0"
          >
            عرضهم
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'إجمالي',     value: totalCount,     color: 'border-white/10    bg-white/5',       text: 'text-white'       },
          { label: 'نشطة',       value: activeCount,    color: 'border-green-500/30 bg-green-500/5',  text: 'text-green-300'   },
          { label: 'في الانتظار', value: pendingCount,  color: 'border-yellow-500/30 bg-yellow-500/5', text: 'text-yellow-300' },
          { label: 'موقوفة',     value: suspendedCount, color: 'border-red-500/30   bg-red-500/5',    text: 'text-red-300'     },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن كافيه..."
            className="w-full bg-white/5 border border-white/10 rounded-xl
                       pr-9 pl-4 py-2.5 text-sm text-white placeholder-gray-500
                       focus:outline-none focus:border-purple-500/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Filter: Status */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
          {([
            { value: 'all',       label: 'الكل'        },
            { value: 'active',    label: 'نشطة'        },
            { value: 'pending',   label: 'انتظار ⏳'   },
            { value: 'suspended', label: 'موقوفة'      },
          ] as { value: FilterStatus; label: string }[]).map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterStatus === opt.value ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter: Plan */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
          {([
            { value: 'all',        label: 'الكل'         },
            { value: 'normal',     label: 'Normal'        },
            { value: 'pro',        label: '💜 Pro'        },
            { value: 'enterprise', label: '⭐ Enterprise'  },
          ] as { value: FilterPlan; label: string }[]).map(opt => (
            <button key={opt.value} onClick={() => setFilterPlan(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterPlan === opt.value ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filtered.length === 0 ? 'مفيش نتايج' : `${filtered.length} من ${totalCount} كافيه`}
          </p>
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPlan('all') }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            مسح الفلاتر ×
          </button>
        </div>
      )}

      {/* القائمة */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-visible">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">
            {hasActiveFilters ? `نتايج البحث (${filtered.length})` : 'كل الكافيهات'}
          </h3>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filtered.map(tenant => {
              const plan       = planBadge(tenant.plan)
              const status     = statusBadge(tenant.status)
              const isDeleting = deletingId === tenant.id

              return (
                <Link key={tenant.id} href={`/admin/tenants/${tenant.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group">

                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0
                    ${tenant.status === 'pending'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-purple-600/20 border-purple-500/20'}`}>
                    {tenant.status === 'pending' ? '⏳' : '🏪'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                      {search.trim() ? highlightMatch(tenant.name, search) : tenant.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">👥 {tenant.userCount} مستخدم</span>
                      <span className="text-xs text-gray-500">🎮 {tenant.deviceCount} جهاز</span>
                      {tenant.subscription?.end_date
                        ? <SubscriptionInfo sub={tenant.subscription} />
                        : <span className="text-xs text-gray-600">بدون اشتراك</span>
                      }
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border hidden sm:inline-flex ${plan.cls}`}>
                      {plan.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${status.cls}`}>
                      {status.label}
                    </span>

                    {tenant.status !== 'active' && (
                      <button
                        onClick={(e) => handleDelete(e, tenant.id, tenant.name)}
                        disabled={isDeleting}
                        title="حذف الكافيه"
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                                   text-gray-600 hover:text-red-400 hover:bg-red-500/10
                                   border border-transparent hover:border-red-500/20
                                   transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                      >
                        {isDeleting ? '⏳' : '🗑'}
                      </button>
                    )}

                    <span className="text-gray-600 group-hover:text-gray-400 transition-colors">←</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            {hasActiveFilters ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-gray-400">مفيش كافيهات بتطابق البحث</p>
                <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPlan('all') }}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  مسح الفلاتر والرجوع للكل
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">🏪</div>
                <p className="text-sm text-gray-400">لا توجد كافيهات مسجلة بعد</p>
                <Link href="/admin/tenants/new"
                  className="mt-3 inline-block text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  + أضف أول كافيه
                </Link>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ── SubscriptionInfo ─────────────────────────────────────────
// بيعرض تواريخ الاشتراك + الأيام المتبقية في قائمة الكافيهات
function SubscriptionInfo({ sub }: { sub: NonNullable<Subscription> }) {
  if (!sub.end_date) return null

  const endReal  = new Date(sub.end_date)
  // نعرض للـ super_admin التاريخ الحقيقي (32 يوم) وليس 30
  const diff     = endReal.getTime() - Date.now()
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))

  const color =
    daysLeft <= 0 ? 'text-red-400' :
    daysLeft <= 3 ? 'text-red-400' :
    daysLeft <= 7 ? 'text-yellow-400' :
    'text-green-400'

  const dateStr = endReal.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <span className={`text-xs font-medium ${color} flex items-center gap-1`}>
      <span>📅</span>
      <span>
        {daysLeft <= 0
          ? `انتهى في: ${dateStr}`
          : `ينتهي في: ${dateStr}`
        }
      </span>
      {daysLeft > 0 && (
        <span className="text-gray-600">({daysLeft} يوم)</span>
      )}
    </span>
  )
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-purple-500/30 text-purple-200 rounded px-0.5">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  )
}
