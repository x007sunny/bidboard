# Bidboard — upload this zip

This zip is the **full app**: categories + subcategory/state filters + auto-detect + **check-your-listing before payment**.

Do **not** use `bidboard-fixed.zip`. That older zip dropped categories.

Do these in order. You do not need a terminal.

## 1. Neon (do this first)

1. Open [console.neon.tech](https://console.neon.tech)
2. Open your Bidboard project
3. SQL Editor
4. Paste everything in `NEON-subcategory-states.sql`
5. Run

Safe to run even if you already ran it (`IF NOT EXISTS`). Existing listings stay on the board.

You do **not** need any other SQL.

## 2. GitHub

1. Unzip `bidboard.zip` on your computer
2. Open [github.com/x007sunny/bidboard](https://github.com/x007sunny/bidboard)
3. Upload **over** the existing files (do not delete `public/logo.png` if GitHub already has the latest logo)
4. Commit to `main`

Include:

- `src/` (all of it — including `src/app/check/` and `src/app/api/preview/`)
- `prisma/`
- `NEON-subcategory-states.sql`
- `package.json` (do not bump unrelated packages)
- `public/favicon.png` if it is in the zip

Do **not** upload `node_modules` or `.next`.

## 3. Vercel

Wait until the deployment is Ready, then hard-refresh bidboard.com.au.

## What you should see

Homepage form is only:

- website URL
- **Get on the board**

No category dropdown on the homepage.

After submit: **Check your listing** (name, category, subcategory, location). Then Stripe.

Existing listings stay visible. They get a subcategory / states when:

- someone re-bids, **or**
- you open Admin → Refresh title & description from website

New listings are classified from the website. The bidder confirms or edits before paying. A listing is only created after Stripe payment succeeds.
