# bidboard.com.au

Exact clone of [outbid.lol](https://outbid.lol/) focused on Australian businesses (restaurants, services, shops, online stores, etc.).

**Currency:** AUD  
**Domain:** bidboard.com.au

## Features

- Pure pay-to-rank leaderboard (highest bid = highest rank)
- New listings start at $5 AUD
- Raise your own listing (pay only the difference)
- Claim any rank
- Click tracking
- Categories
- Latest activity feed
- Stripe Checkout + Webhooks
- Clean modern UI matching the original

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Prisma + PostgreSQL
- Stripe

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required values:
- `DATABASE_URL` – Postgres connection string (Neon or Supabase recommended)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for client)
- `NEXT_PUBLIC_BASE_URL` – `https://bidboard.com.au` (or `http://localhost:3000` for local)

### 3. Database

```bash
npx prisma db push
```

### 4. Stripe Webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret into `.env`.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import project on Vercel
3. Add all environment variables
4. Set up Stripe webhook endpoint: `https://bidboard.com.au/api/webhook`
5. Deploy

## Ranking Rules (same as original)

- New listing minimum: **$5 AUD**
- To take #1: current top bid + **$5**
- Raise your own listing: pay only the difference (minimum +$1)
- Equal bids: older listing keeps higher rank
- Rank is purely the bid amount

---

Built as a clean, modern, production-ready package.
