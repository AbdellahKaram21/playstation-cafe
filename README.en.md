# PlayStation Cafe (SaaS)

A Next.js app for managing PlayStation cafe features (plans, notifications, analytics) with Supabase as backend.

Prerequisites
- Node.js 20+ and npm
- A Supabase project (credentials in .env.local)

Quick start
1. Install dependencies:
   npm install
2. Run development server:
   npm run dev
3. Build for production:
   npm run build
   npm run start

Available scripts (from package.json)
- dev: next dev
- build: next build
- start: next start
- lint: eslint

Environment
- Copy .env.local.example to .env.local and set Supabase credentials (see DEVELOPMENT_LOG.md for notes).

Project layout (key files)
- src/app: Next.js app routes and pages
- src/lib: utilities (see plan-utils.ts for client-safe helpers)
- public: static assets
- DEVELOPMENT_LOG.md: dev notes and setup history

Notes for contributors
- Some utilities import server-only APIs (next/headers); use src/lib/plan-utils.ts for client-safe helpers to avoid server imports in client components.
- Follow coding style (TypeScript + Tailwind + Next 16). Check lint with npm run lint.

Where to learn more
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs

Contact
- See DEVELOPMENT_LOG.md for authors and contributors history.
