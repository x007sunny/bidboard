# Bidboard — upload this zip

This zip is the **full app**: categories + confirmation before pay + admin category manager.

Do these in order. You do not need a terminal.

## 1. Neon (do this first)

1. Open [console.neon.tech](https://console.neon.tech)
2. Open your Bidboard project
3. SQL Editor

If you have **not** already added subcategory/states, run `NEON-subcategory-states.sql`.

Then run **`NEON-categories.sql`** (this is new). Safe to run more than once.

Default categories are filled in automatically the first time the site loads after this.

## 2. GitHub

1. Unzip `bidboard.zip` on your computer
2. Open [github.com/x007sunny/bidboard](https://github.com/x007sunny/bidboard)
3. Upload **over** the existing files (do not delete `public/logo.png` if GitHub already has the latest logo)
4. Commit to `main`

Include:

- `src/` (all of it)
- `prisma/`
- `NEON-subcategory-states.sql`
- `NEON-categories.sql`
- `package.json`

Do **not** upload `node_modules` or `.next`.

## 3. Vercel

Wait until the deployment is Ready, then hard-refresh bidboard.com.au.

## What you should see

- Category pills sit just under the header
- Check your listing: description field, shorter scrape warning, no extra “something wrong” line
- Admin → **Categories**: add, edit, reorder, delete
