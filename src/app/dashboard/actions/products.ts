'use server'
// ============================================================
// FILE: src/app/dashboard/actions/products.ts
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  error?: string
  success?: boolean
}

// ── Helper: جيب الـ client + tenant + role ──────────────────
async function getClientAndTenant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, tenantId: null, role: null }

  const { data } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    tenantId: data?.tenant_id ?? null,
    role:     data?.role      ?? null,
  }
}

// ── Helper: هل اليوزر عنده صلاحية تعديل المنتجات؟ ──────────
// الكاشير يقدر يبيع ويعدّل الكميات على الجلسة بس
// owner وadmin يقدروا يضيفوا/يعدّلوا/يحذفوا المنتجات
function canManageProducts(role: string | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'super_admin'
}

// ── Helper: حدّث products_total في الـ session بعد أي تعديل ─
// بيحسب مجموع كل الـ sales الحالية للجلسة من DB
// وبيكتب القيمة الجديدة في sessions.products_total
async function syncSessionProductsTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string
): Promise<void> {
  // جيب كل الـ sales للجلسة دي مع سعر البيع بتاع كل منتج
  const { data: sales } = await supabase
    .from('sales')
    .select('quantity, unit_price')
    .eq('session_id', sessionId)

  // اجمع الكل
  const total = (sales ?? []).reduce(
    (sum, s) => sum + s.quantity * s.unit_price,
    0
  )

  // اكتب الـ total الجديد في الجلسة
  await supabase
    .from('sessions')
    .update({ products_total: parseFloat(total.toFixed(2)) })
    .eq('id', sessionId)
}


// ============================================================
// ACTION 1: addProduct
// المسموح: owner, admin فقط — الكاشير ممنوع
// ============================================================
export async function addProduct(formData: FormData): Promise<ActionResult> {
  const { supabase, tenantId, role } = await getClientAndTenant()
  if (!tenantId)                return { error: 'غير مصرح' }
  if (!canManageProducts(role)) return { error: 'مش عندك صلاحية إضافة منتجات' }

  const name        = formData.get('name') as string
  const category    = formData.get('category') as string
  const subcategory = formData.get('subcategory') as string
  const quantity    = parseInt(formData.get('quantity') as string)
  const buyPrice    = parseFloat(formData.get('buy_price') as string)
  const sellPrice   = parseFloat(formData.get('sell_price') as string)

  if (!name || isNaN(quantity) || isNaN(buyPrice) || isNaN(sellPrice)) {
    return { error: 'من فضلك اكمل جميع الحقول' }
  }
  if (sellPrice <= 0 || buyPrice <= 0) return { error: 'الأسعار لازم تكون أكبر من صفر' }
  if (quantity < 0)                    return { error: 'الكمية لازم تكون صفر أو أكثر' }

  const { error } = await supabase.from('products').insert({
    tenant_id:   tenantId,
    name,
    category:    category    || null,
    subcategory: subcategory || null,
    quantity,
    buy_price:   buyPrice,
    sell_price:  sellPrice,
    is_active:   true,
  })

  if (error) {
    console.error('addProduct error:', error)
    return { error: 'فشل إضافة المنتج' }
  }

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pos')
  return { success: true }
}


// ============================================================
// ACTION 2: updateProduct
// المسموح: owner, admin فقط
// ============================================================
export async function updateProduct(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, role } = await getClientAndTenant()
  if (!canManageProducts(role)) return { error: 'مش عندك صلاحية تعديل المنتجات' }

  const name        = formData.get('name') as string
  const category    = formData.get('category') as string
  const subcategory = formData.get('subcategory') as string
  const quantity    = parseInt(formData.get('quantity') as string)
  const buyPrice    = parseFloat(formData.get('buy_price') as string)
  const sellPrice   = parseFloat(formData.get('sell_price') as string)

  const { error } = await supabase
    .from('products')
    .update({
      name,
      category:    category    || null,
      subcategory: subcategory || null,
      quantity,
      buy_price:   buyPrice,
      sell_price:  sellPrice,
    })
    .eq('id', productId)

  if (error) {
    console.error('updateProduct error:', error)
    return { error: 'فشل تعديل المنتج' }
  }

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pos')
  return { success: true }
}


// ============================================================
// ACTION 3: toggleProduct
// المسموح: owner, admin فقط
// ============================================================
export async function toggleProduct(
  productId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { supabase, role } = await getClientAndTenant()
  if (!canManageProducts(role)) return { error: 'مش عندك صلاحية' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)

  if (error) return { error: 'فشل تحديث المنتج' }

  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard/pos')
  return { success: true }
}


// ============================================================
// ACTION 4: sellProduct — البيع مع خصم المخزون
// المسموح: الكل (owner, admin, cashier)
// ============================================================
export async function sellProduct(
  productId: string,
  quantity:  number,
  sessionId: string | null
): Promise<ActionResult> {
  const { supabase } = await getClientAndTenant()

  // ✅ TypeScript fix: الـ rpc بيتوقع string | undefined مش string | null
  // فبنحوّل null → undefined بـ ?? undefined
  const { error } = await supabase.rpc('sell_product', {
    p_product_id: productId,
    p_quantity:   quantity,
    p_session_id: sessionId ?? undefined,
  })

  if (error) {
    console.error('sellProduct error:', error)
    if (error.message.includes('Insufficient stock')) {
      return { error: 'الكمية المتاحة غير كافية' }
    }
    return { error: 'فشل إتمام البيع' }
  }

  // بعد البيع، حدّث products_total في الجلسة
  if (sessionId) {
    await syncSessionProductsTotal(supabase, sessionId)
  }

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/products')
  return { success: true }
}


// ============================================================
// ACTION 5: updateSaleQuantity — تعديل كمية منتج على الجلسة
// المسموح: الكل (owner, admin, cashier)
// ============================================================
export async function updateSaleQuantity(
  saleId:      string,
  productId:   string,
  oldQuantity: number,
  newQuantity: number,
): Promise<ActionResult> {
  if (newQuantity <= 0) return { error: 'الكمية لازم تكون أكبر من صفر' }

  const { supabase } = await getClientAndTenant()

  // جيب الـ session_id من الـ sale قبل ما نعدّل
  const { data: saleData } = await supabase
    .from('sales')
    .select('session_id')
    .eq('id', saleId)
    .single()

  // حدّث الكمية في جدول sales
  const { error: saleError } = await supabase
    .from('sales')
    .update({ quantity: newQuantity })
    .eq('id', saleId)

  if (saleError) return { error: 'فشل تعديل الكمية' }

  // diff موجب = كمية أقل → نرجع للمخزون
  // diff سالب = كمية أكثر → نخصم من المخزون
  const diff = oldQuantity - newQuantity
  const { error: stockError } = await supabase.rpc('increment_stock', {
    p_id:   productId,
    amount: diff,
  })

  if (stockError) return { error: 'فشل تحديث المخزون' }

  // حدّث products_total في الجلسة
  if (saleData?.session_id) {
    await syncSessionProductsTotal(supabase, saleData.session_id)
  }

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/products')
  return { success: true }
}


// ============================================================
// ACTION 6: deleteSale — حذف منتج من الجلسة وإرجاع كميته
// المسموح: الكل (owner, admin, cashier)
// ============================================================
export async function deleteSale(
  saleId:    string,
  productId: string,
  quantity:  number,
): Promise<ActionResult> {
  const { supabase } = await getClientAndTenant()

  // جيب الـ session_id قبل الحذف
  const { data: saleData } = await supabase
    .from('sales')
    .select('session_id')
    .eq('id', saleId)
    .single()

  // احذف الـ sale
  const { error: deleteError } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)

  if (deleteError) return { error: 'فشل حذف العنصر' }

  // رجّع الكمية للمخزون
  const { error: stockError } = await supabase.rpc('increment_stock', {
    p_id:   productId,
    amount: quantity,
  })

  if (stockError) return { error: 'فشل إرجاع المخزون' }

  // حدّث products_total في الجلسة
  if (saleData?.session_id) {
    await syncSessionProductsTotal(supabase, saleData.session_id)
  }

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/products')
  return { success: true }
}


// ============================================================
// ACTION 7: restockProduct — تعبئة المخزون
// المسموح: owner, admin فقط
// ============================================================
export async function restockProduct(
  productId:   string,
  addQuantity: number
): Promise<ActionResult> {
  const { supabase, role } = await getClientAndTenant()
  if (!canManageProducts(role)) return { error: 'مش عندك صلاحية' }

  if (addQuantity <= 0) return { error: 'الكمية لازم تكون أكبر من صفر' }

  const { data: product } = await supabase
    .from('products')
    .select('quantity')
    .eq('id', productId)
    .single()

  if (!product) return { error: 'المنتج مش موجود' }

  const { error } = await supabase
    .from('products')
    .update({ quantity: product.quantity + addQuantity })
    .eq('id', productId)

  if (error) return { error: 'فشل تحديث المخزون' }

  revalidatePath('/dashboard/products')
  return { success: true }
}
