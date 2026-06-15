// ============================================================
// FILE: src/lib/supabase/client.ts
// PURPOSE: Supabase client for use inside Client Components ('use client').
//
// WHY A SEPARATE FILE?
// Next.js App Router has two environments:
//   1. SERVER: Runs on the server (no browser, no cookies API)
//   2. CLIENT: Runs in the user's browser (has localStorage, cookies, window, etc.)
//
// Each environment needs a different way to handle authentication cookies.
// This file handles the BROWSER side.
// ============================================================

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// -----------------------------------------------------------
// createBrowserClient
// -----------------------------------------------------------
// This creates a Supabase client that:
//   - Runs entirely in the browser
//   - Reads/writes auth cookies automatically via document.cookie
//   - Keeps the user's session alive (auto-refreshes tokens)
//
// We wrap it in a function so every call returns a fresh instance.
// This avoids stale state between renders.
//
// The <Database> generic = TypeScript knows exactly what tables/columns exist.
// Without it: supabase.from('anything') → no errors even for typos.
// With it:    supabase.from('anythign')  → TypeScript ERROR immediately ✅

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // The "!" after each env var tells TypeScript:
    // "Trust me, this value exists — I checked my .env.local"
    // Without "!": TypeScript complains it might be undefined
  )
}

// -----------------------------------------------------------
// HOW TO USE IN A CLIENT COMPONENT:
// -----------------------------------------------------------
//
// 'use client'
// import { createClient } from '@/lib/supabase/client'
//
// export default function MyComponent() {
//   const supabase = createClient()
//
//   async function fetchDevices() {
//     const { data, error } = await supabase
//       .from('devices')       // TypeScript knows this table exists ✅
//       .select('*')
//       .eq('status', 'available')
//
//     if (error) console.error(error)
//     return data
//   }
// }
