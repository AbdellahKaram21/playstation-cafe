// src/app/dashboard/pos/page.tsx
import { createClient } from '@/lib/supabase/server'
import POSLayout from './components/POSLayout'

export default async function POSPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, hourly_rate, products_total, type, duration_minutes,
      devices ( id, name, type ),
      sales (
        id, product_id, quantity,
        products ( id, name, sell_price )
      )
    `)
    .eq('status', 'active')
    .order('start_time', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('quantity', 0)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  // ✅ بنمرر البيانات دايماً لـ POSLayout — حتى لو sessions فارغة
  // POSLayout هو اللي بيقرر يعرض إيه حسب حالة الجلسات
  return (
    <POSLayout sessions={(sessions as any) ?? []} products={products ?? []} />
  )
}
