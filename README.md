# KalaKriti Online (Lade Studio)

A full-stack e-commerce web app for showcasing and selling handcrafted artworks, built with Next.js 15, Supabase, and Genkit AI.

## Features

- **Product showcase & detail pages** — image galleries, descriptions, specifications, pricing
- **Shopping cart & checkout** — streamlined cart flow and checkout experience
- **Wishlist** — save favourite items (with account)
- **AI artwork suggestions** — Genkit-powered recommendations for similar artworks based on viewing/purchase history
- **Custom design studio** — `custom-design` page for bespoke artwork requests
- **Payment integration** — Razorpay and Stripe gateways
- **Blog, About, product search, reviews** — content pages, search dialog, review components
- **API routes** — `src/app/api/fix-product-slugs` and `fix-slugs` for product-slug maintenance
- Responsive design — Playfair (headings) + Lato (body), terracotta/gold artisanal theme

## Tech Stack

- **Frontend:** Next.js 15.3.3 (App Router), React 18, Tailwind CSS, Radix UI, shadcn-style components
- **Backend:** Supabase (Postgres + Auth; `supabase/` dir, `src/sql/`, seed scripts in `scripts/`)
- **AI:** Genkit (`@genkit-ai/googleai`, `@genkit-ai/firebase`, `@genkit-ai/next`) — artwork suggestion flows in `src/ai/flows/`
- **Hosting:** Firebase App Hosting (`apphosting.yaml`)

## Quick Start

```bash
npm install
npm run dev   # dev server (see package.json scripts)
```

### Environment variables

Create a `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Database

```bash
npm run db:seed   # seed the catalog
npm run db:clear  # clear seeded data
npm run db:reset  # reset + reseed
```

### Typecheck

```bash
npm run typecheck
```

## Project Structure

```
src/
  app/          # App Router pages (products, cart, checkout, auth, blog, my-account)
  app/api/      # API routes (slug maintenance)
  ai/           # Genkit AI flows (artwork suggestions)
  components/   # UI components (product cards, auth, checkout, reviews)
  context/      # React context providers
  hooks/        # Custom hooks
  lib/          # Supabase client, utilities
  sql/          # SQL migrations/seed data
supabase/       # Supabase project config
scripts/        # DB seed scripts (tsx)
docs/blueprint.md  # Original product blueprint
```

## Deploy Notes

This is a **dynamic** Next.js app: it requires a Node.js runtime, Supabase credentials, and Genkit/Firebase AI credentials. It cannot be statically exported (API routes + server actions). Deploy to a Node-capable platform (Netlify, Vercel, Firebase App Hosting) with the env vars above set.

---

Built by [Girish Lade](https://ladestack.in)
