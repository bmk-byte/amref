# H4GT Resource Library

Public resource library for Amref Health Africa Uganda's "Heroes For Gender Transformative"
(H4GT) project — replaces the original Google Drive + Google Site plan with a Next.js app on
Supabase (database + storage) and Vercel (hosting).

**Live site:** https://h4gt-resource-library.vercel.app
**Admin:** https://h4gt-resource-library.vercel.app/admin/login
**Supabase project:** `h4gt-resource-library` (`hvcauuelyrdudptupwsl`)

## How it works

- The public homepage (`/`) shows all six sections — Reports, Abstracts, Human Interest Stories,
  Photos, IEC Materials, Impact Series — as one searchable/filterable page. It only ever shows
  assets with `status = published`; this is enforced by database row-level security, not just app
  logic, so there's no way for a draft or un-consented item to leak publicly.
- Staff sign in at `/admin` to upload files, tag them, and move them through
  `draft → pending_consent → cleared → published` (or `rejected`).
- `/admin/consent` holds consent records (subject, scope, signed date, scanned form). This table
  is staff-only and never exposed publicly. Photos, Human Interest Stories, and Impact Series
  assets **cannot** be published without a linked, active consent record — the "Publish" action
  checks this server-side before flipping the status, so it can't be bypassed from the UI.

## Adding staff logins

There's no self-signup — accounts are created by an admin in the Supabase dashboard:
Project `h4gt-resource-library` → Authentication → Users → Add User. Give them the email/password
they'll use at `/admin/login`.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://hvcauuelyrdudptupwsl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from Supabase dashboard>
```

## Redeploying

This was deployed directly (no git repo attached yet). To redeploy after code changes, either:
- Connect this project to a GitHub repo in Vercel for automatic deploys, or
- Redeploy manually via the Vercel dashboard / CLI.

## Known tradeoffs from the rushed one-night build

- The header logo is pulled live from `amref.org` rather than self-hosted — fine for now, but
  worth swapping to a hosted copy if that URL ever changes.
- No lockfile was committed with this deploy, so dependency versions may drift slightly on a
  fresh `npm install`. Run `npm install` locally and commit `package-lock.json` once this is
  moved into a git repo.
- Content population (uploading the actual H4GT materials) is an ongoing task for the
  Communications Manager via `/admin`, not something finished in the initial build.
