# How to put this on GitHub (no terminal needed)

Download **bidboard-fixed.zip** (the file from this chat). Do not use the old `bidboard-p0.zip`.

## 1. Unzip on your computer

You should see a folder called `bidboard-fixed` with `src`, `prisma`, `public`, `package.json`.

## 2. Upload over GitHub

1. Open https://github.com/x007sunny/bidboard
2. Click **Add file** → **Upload files**
3. Drag **everything inside** `bidboard-fixed` (not the folder itself)
4. Make sure these are included:
   - `src/` (all of it)
   - `prisma/`
   - `public/favicon.png` and `public/logo.png`
   - `package.json`
   - `next.config.ts`
5. Commit to **main**

Do **not** upload `node_modules` or `.next` (they are not in this zip).

You do **not** need to delete the repo. Uploading over the same filenames is enough.

## 3. Wait for Vercel

Open Vercel → bidboard project → Deployments.

Wait until the new one says **Ready** (green). Then hard-refresh https://bidboard.com.au

If it still looks old, wait 1 minute and hard-refresh again (Ctrl+Shift+R).

## 4. Neon

You already created the `StripeEvent` and `Visitor` tables. You do **not** need to run SQL again.

## What this zip fixes

- Vercel build error in `src/lib/safeFetch.ts`
- Titles now prefer **og:title**, then twitter title, then the page `<title>`
- Descriptions now prefer **og:description**, then the meta description
- Skips junk titles like “Home”
- Retries sites that block normal browsers (e.g. Harvey Norman)
- Favicon in the browser tab
