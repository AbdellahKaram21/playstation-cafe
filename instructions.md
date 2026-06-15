Project: PlayStation Cafe SaaS (Multi-tenant)

## Tech Stack
- Framework: Next.js (App Router)
- Database & Auth: Supabase
- Styling: Tailwind CSS + Shadcn UI
- Real-time: Supabase Realtime (for sessions/devices)

## Core Business Logic
1. Multi-tenancy: Every table MUST have a `tenant_id`. 
2. RLS: Row Level Security must isolate data so users only see their tenant's data.
3. Sessions: 
   - Start: Mark device as `in_use`, store `start_time`.
   - End: Calculate price = (duration * hourly_rate) + product_sales.
4. Inventory: Deduct product quantity on sale; prevent sale if quantity is 0.

## Database Schema (Summary)
- tenants (id, name, plan, status)
- users (id, tenant_id, email, role: admin|owner|cashier)
- devices (id, tenant_id, name, type, hourly_rate, status)
- sessions (id, tenant_id, device_id, start_time, end_time, total_price, status)
- products (id, tenant_id, name, quantity, buy_price, sell_price)
- sales (id, tenant_id, session_id?, product_id, quantity, total)
- subscriptions (id, tenant_id, plan, status, end_date)

## Implementation Roadmap (Chunks)
- Chunk 1: Database Schema & RLS Policies.
- Chunk 2: Auth Flow & Middleware (Role-based routing).
- Chunk 3: Device Management & Real-time Sessions.
- Chunk 4: POS System & Inventory Logic.
- Chunk 5: Admin Panel (SaaS Management) & Daily Reports.