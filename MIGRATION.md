# Pocketbase Migration Guide

This document outlines the migration from Supabase to a self-hosted Pocketbase instance on `pb.giveback.guide` (Pikapods).

## Overview

All auth, lists, and completion tracking now runs on Pocketbase. The old Supabase files (`src/lib/supabase.ts`) remain in the codebase for emergency rollback but are no longer imported by default.

## Environment Variables

Update your `.env` and GitHub repository variables:

```
PUBLIC_AUTH_PROVIDER=pocketbase
PUBLIC_POCKETBASE_URL=https://pb.giveback.guide
```

Remove from production:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON`

Keep locally (for migration scripts only):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (old project URL)

## Pre-Migration Setup (do this well in advance)

### 1. Deploy Pocketbase on Pikapods

- Create a new Pocketbase pod on Pikapods
- Set the admin superuser credentials
- Note the public URL

### 2. Configure SMTP

Pocketbase requires an SMTP provider for OTP emails. Configure in the admin UI:
**Settings → Mail Settings**

Options: Mailgun, SendGrid, Resend, Brevo, or Gmail SMTP.

### 3. Configure CORS

In the admin UI: **Settings → CORS**
Add your production origin (`https://giveback.guide`) and `http://localhost:4321` for local dev.

### 4. Run the Collection Setup Script

```bash
# Set environment variables
export PB_URL=https://pb.giveback.guide
export PB_ADMIN_EMAIL=your-admin-email@example.com
export PB_ADMIN_PASSWORD=your-admin-password

# Run the setup script
node scripts/setup-pb-collections.js
```

This creates:
- `users` collection with OTP enabled, custom `name` and `prefs` fields
- `lists` collection with user relations and API rules
- `list_items` collection with list relations and cascade delete
- `user_item_status` collection with user relations and composite unique index

### 5. Test OTP Authentication Locally

Update your `.env` to point at the Pocketbase instance, run `pnpm run dev`, and test the login flow end-to-end.

## Cutover Day (the live migration)

### Step 1: Block Login (Deploy Maintenance Mode)

Deploy a temporary commit on `main` that hides the login form. This prevents any new data writes during the migration window.

### Step 2: Export Data from Supabase

In the Supabase dashboard:
1. **Table Editor → `lists`** → Export → CSV
2. **Table Editor → `list_items`** → Export → CSV
3. **Table Editor → `user_item_status`** → Export → CSV

### Step 3: Migrate Users

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key
export PB_URL=https://pb.giveback.guide
export PB_ADMIN_EMAIL=your-admin-email
export PB_ADMIN_PASSWORD=your-admin-password

node scripts/migrate-users-to-pb.js
```

This creates 37 user records in Pocketbase with the **exact same UUIDs** as Supabase, preserving `name` and `prefs` metadata.

### Step 4: Import Data Tables

In the Pocketbase admin UI:
1. **Collections → `lists`** → Import → Upload `lists.csv`
2. **Collections → `list_items`** → Import → Upload `list_items.csv`
3. **Collections → `user_item_status`** → Import → Upload `user_item_status.csv`

Since user IDs are preserved, the relation fields map perfectly.

### Step 5: Verify Data

- Spot-check users in the PB admin UI
- Confirm list counts and item counts look correct
- Check that `user_item_status` records are associated with the correct users

### Step 6: Merge the Migration Branch

```bash
git checkout main
git merge migrate-to-pocketbase
```

### Step 7: Update GitHub Repository Variables

In your GitHub repository settings:
- Remove `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON` (vars)
- Add `PUBLIC_POCKETBASE_URL` = `https://pb.giveback.guide` (vars)
- Ensure `PUBLIC_AUTH_PROVIDER` is set to `pocketbase` (vars)

### Step 8: Push and Deploy

```bash
git push origin main
```

GitHub Actions builds and deploys automatically.

### Step 9: Remove Login Block

Revert the temporary maintenance mode commit.

### Step 10: Cleanup

- Cancel the Supabase project
- Remove old Supabase env vars from GitHub entirely
- Delete the `scripts/migrate-users-to-pb.js` script from the repo (it's done its job)

## Rollback Plan

If anything goes wrong after the cutover:

1. **Revert the merge commit** on `main`
2. **Re-enable Supabase** by restoring the old GitHub repository variables
3. The old Supabase project is still live until you cancel it
4. Push the revert → the site rolls back to the Supabase-connected build

## Architecture Changes

### Auth Flow
- **Before**: Supabase Magic Link (`signInWithOtp`) → email link with `?userId=...&secret=...` → `getSessionFromUrl()`
- **After**: Pocketbase OTP (`requestOTP`) → email link with `?otpId=...&code=...` → `authWithOTP()`

### Data Access
- **Before**: `supabase.from('table').select()` / `.insert()` / `.update()` / `.delete()`
- **After**: `pb.collection('table').getList()` / `.create()` / `.update()` / `.delete()`

### Session Storage
- **Before**: `localStorage` key matching `^sb-.*-auth-token$`
- **After**: `localStorage` key `pb_auth`

### User Metadata
- **Before**: Stored in `user_metadata` JSON on Supabase auth user
- **After**: Stored as custom fields (`name`, `prefs`) directly on the Pocketbase `users` collection record

## Schema Mapping

| Supabase Table | Pocketbase Collection | Notes |
|---|---|---|
| `auth.users` | `users` | Built-in auth collection with custom fields added |
| `public.lists` | `lists` | `user_id` → `user` relation field |
| `public.list_items` | `list_items` | `list_id` → `list` relation field, cascade delete enabled |
| `public.user_item_status` | `user_item_status` | `user_id` → `user` relation field, composite unique index on `user, item_type, item_id` |

## API Rules (Replaces RLS)

All collections use the same ownership pattern:

```
listRule:   @request.auth.id != "" && user = @request.auth.id
viewRule:   @request.auth.id != "" && user = @request.auth.id
createRule: @request.auth.id != ""
updateRule: @request.auth.id != "" && user = @request.auth.id
deleteRule: @request.auth.id != "" && user = @request.auth.id
```

`list_items` checks ownership via the parent list: `list.user = @request.auth.id`

## File Reference

### New Files
- `src/lib/pocketbase.ts` — Auth and session management
- `scripts/setup-pb-collections.js` — One-time collection setup
- `scripts/migrate-users-to-pb.js` — User bulk-import from Supabase

### Modified Files
- `src/lib/auth.ts` — Provider switch now defaults to `pocketbase`
- `src/lib/lists.ts` — Replaced Supabase SDK with Pocketbase SDK
- `src/lib/completed.ts` — Replaced Supabase SDK with Pocketbase SDK
- `src/pages/login.astro` — Updated success messaging
- `src/pages/account/verify.astro` — Reads `otpId` and `code` from URL
- `src/pages/account/dashboard.astro` — Updated inline auth check
- `src/pages/account/onboarding.astro` — Updated inline auth check
- `src/pages/account/profile.astro` — Updated inline auth check
- `src/components/layout/Header.astro` — Updated auth detection
- `src/components/layout/BaseHead.astro` — Updated meta tags
- `src/components/features/save/saveToList.client.js` — Updated auth detection
- `astro.config.mjs` — Updated `optimizeDeps`
- `package.json` — Swapped dependencies
- `.github/workflows/deploy.yml` — Updated env vars

### Legacy Files (kept for rollback)
- `src/lib/supabase.ts` — Old Supabase auth layer (no longer imported by default)

## Post-Migration: Gamification Ready

Pocketbase supports your future gamification plans via:
- **Event hooks** (Go or JavaScript) — auto-award badges on completion events
- **Custom collections** — `badges`, `user_badges`, `user_roles`
- **Realtime subscriptions** — live "badge unlocked" notifications via SSE
- **File fields** — badge icons stored directly in collection records
