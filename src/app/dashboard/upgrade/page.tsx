// ============================================================
// FILE: src/app/dashboard/upgrade/page.tsx
// SERVER COMPONENT
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { getUser }      from '@/app/actions/auth'
import { planLabel }    from '@/lib/plans'
import Link             from 'next/link'
import { redirect }     from 'next/navigation'
import UpgradeButton    from './components/UpgradeButton'

const PLAN_ORDER = ['free', 'pro', 'enterprise']

const PLANS = [
  {
    id:       'free',
    name:     'Normal',
    price:    '500 ج / شهر',
    priceNum: 500,
    color:    'gray',
    icon:     '🔷',
    features: [
      { label: 'أجهزة',          value: '10 أجهزة'    },
      { label: 'موظفين',         value: '5 موظفين'    },
      { label: 'التقارير',       value: '✅ متاح'      },
      { label: 'تصدير البيانات', value: '❌ غير متاح'  },
      { label: 'الدعم',          value: 'دعم عادي'    },
    ],
  },
  {
    id:       'pro',
    name:     'Pro',
    price:    '800 ج / شهر',
    priceNum: 800,
    color:    'purple',
    icon:     '💜',
    popular:  true,
    features: [
      { label: 'أجهزة',          value: '25 جهاز'     },
      { label: 'موظفين',         value: '15 موظف'     },
      { label: 'التقارير',       value: '✅ متاح'      },
      { label: 'تصدير البيانات', value: '✅ متاح'      },
      { label: 'الدعم',          value: 'دعم أولوية'  },
    ],
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    price:    'تواصل معنا',
    priceNum: -1,
    color:    'yellow',
    icon:     '⭐',
    features: [
      { label: 'أجهزة',          value: 'غير محدود'     },
      { label: 'موظفين',         value: 'غير محدود'     },
      { label: 'التقارير',       value: '✅ متاح'        },
      { label: 'تصدير البيانات', value: '✅ متاح'        },
      { label: 'الدعم',          value: 'دعم مخصص 24/7' },
    ],
  },
]

export default async function UpgradePage() {
  const supabase = await createClient()
  const user     = await getUser()

  if (user?.role !== 'owner' && user?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan, name')
    .eq('id', user.tenant_id)
    .single()

  const currentPlan  = tenant?.plan ?? 'free'
  const currentIndex = PLAN_ORDER.indexOf(currentPlan)

  // جيب الطلب المعلق لو في
  const { data: pendingRequest } = await supabase
    .from('upgrade_requests')
    .select('id, to_plan, request_type, created_at')
    .eq('tenant_id', user.tenant_id)
    .eq('status', 'pending')
    .maybeSingle()

  // جيب الـ subscription الحالية
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, start_date, end_date')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // احسب الأيام المتبقية — نعرض للمستخدم 30 يوم (مش 32)
  let daysLeftDisplay: number | null = null
  if (subscription?.end_date) {
    const diff    = new Date(subscription.end_date).getTime() - Date.now()
    const actual  = Math.ceil(diff / (1000 * 60 * 60 * 24))
    // نطرح 2 عشان نعرض 30 يوم للمستخدم بدل 32
    daysLeftDisplay = Math.max(0, actual - 2)
  }

  const { data: subHistory } = await supabase
    .from('subscriptions')
    .select('id, plan, status, start_date, end_date, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6 max-w-4xl pt-10 lg:pt-0" dir="rtl">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">الخطط والاشتراكات</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          خطتك الحالية:{' '}
          <span className="text-purple-300 font-semibold">{planLabel(currentPlan)}</span>
          {daysLeftDisplay !== null && (
            <span className={`mr-2 text-xs px-2 py-0.5 rounded-full
              ${daysLeftDisplay <= 3  ? 'bg-red-500/15 text-red-400'
              : daysLeftDisplay <= 7  ? 'bg-yellow-500/15 text-yellow-400'
              : 'bg-green-500/15 text-green-400'}`}>
              {daysLeftDisplay <= 0 ? 'انتهى الاشتراك' : `${daysLeftDisplay} يوم متبقي`}
            </span>
          )}
        </p>
      </div>

      {/* Banner الطلب المعلق */}
      {pendingRequest && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-3">
          <span className="text-2xl shrink-0">⏳</span>
          <div>
            <p className="text-sm font-semibold text-yellow-300">
              طلب {pendingRequest.request_type === 'downgrade' ? 'تخفيض' : 'ترقية'} قيد المراجعة
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              طلبت التحويل إلى خطة{' '}
              <span className="text-white font-medium">{planLabel(pendingRequest.to_plan)}</span>
              {' '}— ستستمر على خطتك الحالية لحين الموافقة
            </p>
          </div>
        </div>
      )}

      {/* مقارنة الخطط */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent   = plan.id === currentPlan
          const isPending   = pendingRequest?.to_plan === plan.id
          const targetIndex = PLAN_ORDER.indexOf(plan.id)
          const isUpgrade   = targetIndex > currentIndex
          const isDowngrade = targetIndex < currentIndex
          // Enterprise مش بيتطلب — بيتواصل بالإيميل
          const isEnterprise = plan.id === 'enterprise'

          return (
            <div key={plan.id} className={`
              relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200
              ${isCurrent
                ? 'border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                : isPending
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : plan.color === 'yellow'
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }
            `}>

              {/* الشارات */}
              {(plan as any).popular && !isCurrent && !isPending && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    الأكثر شيوعاً
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2">
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ✅ خطتك الحالية
                  </span>
                </div>
              )}
              {isPending && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2">
                  <span className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ⏳ قيد المراجعة
                  </span>
                </div>
              )}

              {/* اسم الخطة والسعر */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plan.icon}</span>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                </div>
                <p className={`text-2xl font-black
                  ${plan.color === 'purple' ? 'text-purple-300' : ''}
                  ${plan.color === 'yellow' ? 'text-yellow-300' : ''}
                  ${plan.color === 'gray'   ? 'text-gray-300'   : ''}
                `}>
                  {plan.price}
                </p>
                {/* مدة الاشتراك — بس للخطط المدفوعة */}
                {plan.priceNum > 0 && (
                  <p className="text-xs text-gray-500 mt-1">مدة الاشتراك: شهر</p>
                )}
              </div>

              {/* المميزات */}
              <div className="flex-1 space-y-2.5">
                {plan.features.map(f => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span className="text-xs font-medium text-gray-300">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* الزرار */}
              <div>
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20
                                  text-center text-xs text-green-400 font-medium">
                    خطتك الحالية
                  </div>

                ) : isPending ? (
                  <div className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20
                                  text-center text-xs text-yellow-400 font-medium">
                    ⏳ قيد المراجعة
                  </div>

                ) : isEnterprise ? (
                  <a
                    href="mailto:support@pscafe.app"
                    className="block w-full py-2.5 rounded-xl text-center text-xs font-bold
                               bg-yellow-500/20 border border-yellow-500/30
                               text-yellow-300 hover:bg-yellow-500/30 transition-colors"
                  >
                    تواصل معنا
                  </a>

                ) : pendingRequest ? (
                  // في طلب تاني معلق — امنع طلب جديد
                  <div className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10
                                  text-center text-xs text-gray-600 cursor-not-allowed">
                    يوجد طلب قيد المراجعة
                  </div>

                ) : isUpgrade ? (
                  // ترقية
                  <UpgradeButton planName={plan.name} planId={plan.id} type="upgrade" />

                ) : isDowngrade ? (
                  // تخفيض — له زرار منفصل بلون مختلف
                  <UpgradeButton planName={plan.name} planId={plan.id} type="downgrade" />

                ) : null}
              </div>

            </div>
          )
        })}
      </div>

      {/* ملاحظة الاشتراك */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3">
        <span className="text-lg shrink-0">ℹ️</span>
        <div className="text-xs text-gray-400 leading-relaxed">
          <p className="font-medium text-gray-300 mb-1">كيف يعمل الاشتراك؟</p>
          <p>بعد موافقة الإدارة على طلبك، يبدأ اشتراك لمدة شهر كامل.</p>
          <p className="mt-1">ستصلك تنبيهات عند اقتراب انتهاء الاشتراك — يمكنك تجديده في أي وقت بإرسال طلب جديد.</p>
        </div>
      </div>

      {/* تاريخ الاشتراكات */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">📋 تاريخ الاشتراكات</h3>
        </div>

        {!subHistory || subHistory.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-400">لا يوجد تاريخ اشتراكات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {subHistory.map(sub => {
              const endDate  = sub.end_date ? new Date(sub.end_date) : null
              // نعرض الأيام المتبقية - 2 عشان اليوزر يشوف 30 يوم
              const actualDiff = endDate
                ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null
              const daysLeft  = actualDiff !== null ? Math.max(0, actualDiff - 2) : null
              const isActive  = sub.status === 'active'
              const isExpired = sub.status === 'expired' || (endDate && actualDiff !== null && actualDiff <= 0)

              return (
                <div key={sub.id} className="flex items-center justify-between px-5 py-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/20
                                    flex items-center justify-center text-base shrink-0">
                      {sub.plan === 'enterprise' ? '⭐' : sub.plan === 'pro' ? '💜' : '🔷'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">خطة {planLabel(sub.plan)}</p>
                      <p className="text-xs text-gray-500">
                        بدأت:{' '}
                        {new Date(sub.start_date).toLocaleDateString('ar-EG', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block text-left">
                      {/* نعرض تاريخ الانتهاء - يومين عشان اليوزر يشوف شهر */}
                      {endDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000)
                            .toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      {daysLeft !== null && daysLeft > 0 && isActive && (
                        <p className={`text-[10px] ${daysLeft <= 7 ? 'text-yellow-400' : 'text-gray-600'}`}>
                          {daysLeft} يوم متبقي
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
                      ${isExpired
                        ? 'bg-red-500/15    text-red-400    border-red-500/20'
                        : isActive
                          ? 'bg-green-500/15 text-green-400  border-green-500/20'
                          : 'bg-gray-500/15  text-gray-400   border-gray-500/20'
                      }`}>
                      {isExpired ? 'منتهي' : isActive ? 'نشط' : 'ملغي'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <Link href="/dashboard/settings" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← العودة للإعدادات
        </Link>
      </div>

    </div>
  )
}
