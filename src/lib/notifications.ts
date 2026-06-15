// ============================================================
// FILE: src/lib/notifications.ts
// PURPOSE: منطق جلب التنبيهات من قاعدة البيانات
//
// أنواع التنبيهات:
//   1. low_stock    — منتج وصل لأقل من 5 وحدات
//   2. out_of_stock — منتج نفد من المخزون
//   3. sub_expiry   — الـ subscription هتخلص خلال 7 أيام
//
// كل ده Server-side بحت — بيتنفذ على السيرفر ويبعت النتيجة
// للـ Client Component (NotificationCenter)
// ============================================================

import { createClient } from '@/lib/supabase/server'

// ── نوع التنبيه الواحد ────────────────────────────────────────
// كل تنبيه عنده:
//   id      — معرّف فريد (بنصنعه إحنا مش من DB)
//   type    — نوع التنبيه
//   title   — العنوان
//   message — الرسالة التفصيلية
//   severity— مستوى الخطورة: info | warning | error
//   href    — الرابط اللي يروح له لما يضغط على التنبيه
export type AppNotification = {
  id:       string
  type:     'low_stock' | 'out_of_stock' | 'sub_expiry'
  title:    string
  message:  string
  severity: 'info' | 'warning' | 'error'
  href:     string
}

// ============================================================
// getNotifications — جيب كل التنبيهات للـ tenant الحالي
//
// بيشتغل إزاي؟
//   - بيجيب المنتجات قليلة المخزون من Supabase
//   - بيجيب الـ subscription ويحسب الأيام المتبقية
//   - بيبني قائمة تنبيهات ويبعتها للـ UI
// ============================================================
export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient()
  const notifications: AppNotification[] = []

  // ── 1. جيب المنتجات اللي مخزونها أقل من 5 ──────────────────
  // بنجيب فقط المنتجات النشطة (is_active = true)
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, name, quantity')
    .eq('is_active', true)
    .lte('quantity', 5)   // lte = less than or equal = أقل من أو يساوي
    .order('quantity', { ascending: true })

  if (lowStockProducts) {
    for (const product of lowStockProducts) {
      if (product.quantity === 0) {
        // نفد من المخزون تماماً — خطورة عالية
        notifications.push({
          id:       `out_of_stock_${product.id}`,
          type:     'out_of_stock',
          title:    'نفد من المخزون',
          message:  `${product.name} — نفد المخزون تماماً`,
          severity: 'error',
          href:     '/dashboard/products',
        })
      } else {
        // مخزون منخفض — تحذير
        notifications.push({
          id:       `low_stock_${product.id}`,
          type:     'low_stock',
          title:    'مخزون منخفض',
          message:  `${product.name} — تبقّى ${product.quantity} فقط`,
          severity: 'warning',
          href:     '/dashboard/products',
        })
      }
    }
  }

  // ── 2. تحقق من الـ subscription ─────────────────────────────
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('end_date, status, plan')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()  // maybeSingle = يرجع null لو مفيش بيانات (مش error)

  if (subscription?.end_date) {
    const endDate  = new Date(subscription.end_date)
    const today    = new Date()

    // الفرق بين اليوم وتاريخ الانتهاء بالأيام
    // Math.ceil = تقريب لأعلى عشان نحسب "أيام كاملة"
    const diffMs   = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      // انتهت الـ subscription
      notifications.push({
        id:       'sub_expired',
        type:     'sub_expiry',
        title:    'انتهى الاشتراك',
        message:  'اشتراكك انتهى — جدّد الاشتراك الآن',
        severity: 'error',
        href:     '/dashboard/settings',
      })
    } else if (diffDays <= 7) {
      // هتخلص خلال 7 أيام — تحذير
      notifications.push({
        id:       'sub_expiry_soon',
        type:     'sub_expiry',
        title:    'الاشتراك قرب الانتهاء',
        message:  `اشتراكك ينتهي خلال ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`,
        severity: diffDays <= 3 ? 'error' : 'warning',
        href:     '/dashboard/settings',
      })
    }
  }

  // ── الترتيب: الأخطاء أولاً، ثم التحذيرات ──────────────────
  // عشان أهم التنبيهات تكون في الأعلى
  const severityOrder = { error: 0, warning: 1, info: 2 }
  notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return notifications
}
