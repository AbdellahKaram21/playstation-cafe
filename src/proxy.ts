// ============================================================
// FILE: src/proxy.ts  ← middleware بـ Role-based routing
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedRoutes = ['/dashboard', '/pos', '/devices', '/products', '/reports']
  const authRoutes      = ['/login', '/register']
  const adminRoutes     = ['/admin']

  const isProtectedRoute = protectedRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute      = authRoutes.some(r => pathname.startsWith(r))
  const isAdminRoute     = adminRoutes.some(r => pathname.startsWith(r))

  // 🔒 مش logged in + صفحة محمية → login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 🔒 مش logged in + admin → login
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 🔒 logged in + admin → لازم super_admin
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // 🔒 كاشير → ممنوع من products وstaff وsettings فقط
  // الكاشير يقدر يدخل: /dashboard، /dashboard/devices، /dashboard/pos، /dashboard/reports
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role === 'cashier') {
      const cashierForbidden = [
        '/dashboard/products',
        '/dashboard/staff',
        '/dashboard/settings',
      ]
      const isForbidden = cashierForbidden.some(r => pathname.startsWith(r))
      if (isForbidden) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/pos'
        return NextResponse.redirect(url)
      }
    }
  }

  // ✅ logged in + auth route → dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
