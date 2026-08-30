# Bidboard (P0)

Pay-to-rank leaderboard. This package is the current Bidboard codebase with four P0 fixes only: bid race, real visitors, SSRF, Stripe webhook idempotency. See `P0.md`.

## GitHub

```bash
unzip bidboard-p0.zip
cd bidboard-p0
git init
git add .
git commit -m "P0: bid race, real visitors, SSRF, Stripe webhook idempotency"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/bidboard.git
git branch -M main
git push -u origin main
```

If you already have `x007sunny/bidboard`, push this tree as a branch instead of force-pushing `main` until you have reviewed it:

```bash
git remote add origin https://github.com/x007sunny/bidboard.git
git fetch origin
git checkout -b p0-fixes
git add .
git commit -m "P0: bid race, real visitors, SSRF, Stripe webhook idempotency"
git push -u origin p0-fixes
```

## Neon

1. Open [console.neon.tech](https://console.neon.tech) → New project → region close to users (e.g. Australia).
2. Copy the pooled connection string (`DATABASE_URL`).
3. From this folder:

```bash
cp .env.example .env
# paste DATABASE_URL plus Stripe keys into .env

npx prisma migrate deploy
npx prisma generate
```

That applies `prisma/migrations/20260830120000_p0_fixes` (`StripeEvent` + `Visitor`) on top of the existing `Listing` / `Payment` tables.

If this database is brand new and the original tables are missing, create them first from `prisma/schema.prisma`:

```bash
npx prisma db push
```

`db push` syncs the full schema. Prefer `migrate deploy` on a live Neon database that already has listings.

## Run locally

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Stripe webhook (separate terminal):

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Put the printed `whsec_…` in `.env` as `STRIPE_WEBHOOK_SECRET`.

## Vercel + Neon + Stripe

1. Import the GitHub repo in Vercel.
2. Vercel env:
   - `DATABASE_URL` — Neon pooled URL
   - `NEXT_PUBLIC_BASE_URL` — `https://your-domain`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if the UI uses it)
   - `ADMIN_PASSWORD`
3. Build command stays `prisma generate && next build` (already in `package.json`).
4. After first deploy, Stripe Dashboard → Webhooks → `https://your-domain/api/webhook` → `checkout.session.completed`.
