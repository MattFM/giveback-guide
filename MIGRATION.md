# Pocketbase Migration Guide

## Current Status: CUTOVER COMPLETE — PRODUCTION LIVE

The migration from Supabase to PocketBase was completed on **4 August 2026**. The site is now fully live on PocketBase. This document tracks what was done, issues encountered, and remaining cleanup tasks.

---

## ✅ Completed

### Pre-Cutover (Done Beforehand)
- [x] `migrate-to-pocketbase` branch pushed to GitHub
- [x] All Supabase data exported (users, lists, list_items, user_item_status)

### Code Migration (Merged to `main`)
- [x] `src/lib/pocketbase.ts` — Auth layer with OTP support, user creation, profile updates
- [x] `src/lib/auth.ts` — Defaults to `pocketbase` provider, removed Supabase fallback import
- [x] `src/lib/lists.ts` — All list CRUD operations using Pocketbase SDK
- [x] `src/lib/completed.ts` — Completion tracking using Pocketbase SDK
- [x] All auth pages updated (`login`, `verify`, `dashboard`, `onboarding`, `profile`)
- [x] `Header.astro`, `BaseHead.astro`, `saveToList.client.js` — Auth detection updated
- [x] `astro.config.mjs` — `optimizeDeps` updated to `pocketbase`
- [x] `package.json` — Dependencies swapped (`@supabase/supabase-js` → `pocketbase`)
- [x] `.github/workflows/deploy.yml` — Environment variables updated
- [x] `AGENTS.md`, `README.md`, `privacy.astro`, `.github/copilot-instructions.md` — Updated

### Pocketbase Instance Configuration (pb.giveback.guide)
- [x] Deployed on Pikapods
- [x] SMTP configured and tested (sends OTP emails successfully)
- [x] Users collection: `name` (text) and `prefs` (json) custom fields added
- [x] Users collection: OTP enabled (300s duration, 8-digit code)
- [x] Users collection: OTP email template configured with `?otpId={OTP_ID}&code={OTP}` link
- [x] Users collection: Create rule left blank (open beta — anyone can create account)
- [x] `lists` collection created with fields, indexes, and API rules
- [x] `list_items` collection created with fields, indexes, cascade delete, and API rules
- [x] `user_item_status` collection created with fields, indexes, composite unique index, and API rules

### Data Migration Results
- **Users migrated**: 72 users from Supabase to PocketBase (original UUIDs preserved)
- **Lists migrated**: 31 lists
- **List items migrated**: 42 list_items
- **User item status migrated**: 15 user_item_status records
- **Newsletter subscription**: Cloudflare Worker integration restored

### Verification (All Passing)
- [x] Existing migrated user login works
- [x] New user sign-up works (open beta)
- [x] Onboarding page saves `name` and `prefs` correctly
- [x] Dashboard loads saved lists and items with correct counts
- [x] Saving projects/stays to lists works
- [x] Creating new lists works
- [x] Marking items as visited (`is_completed`) works
- [x] Unmarking items as visited works
- [x] Newsletter subscription works (footer + onboarding)
- [x] Logout works
- [x] Profile page loads and updates name

### Critical Issues Fixed During Cutover
- [x] **Users collection `id` field rejected UUIDs** — `autogeneratePattern` was `[a-z0-9]{15}` with `max: 15`. Fixed to `max: 36`, `min: 0`, `pattern: ^[a-zA-Z0-9-]+$`, and restored `autogeneratePattern` for new sign-ups.
- [x] **Duplicate user detection failed** — PocketBase returns `validation_not_unique` in `error.data.email.code`, but the app only checked for the string `"already exists"`. Updated `createMagicURLSession` to check both `message` and `data.email.code` across all response shapes.
- [x] **Newsletter subscription broken** — `PUBLIC_WORKER_URL` was missing from GitHub repository variables and the build workflow. Added the variable and updated `.github/workflows/deploy.yml` to pass it to the build step.

### Known Issues Fixed During Development
- [x] Safari syntax error: `async import` → patched `pocketbase` package in `node_modules`
- [x] Build failure: Vite trying to bundle `supabase.ts` → removed fallback import from `auth.ts`
- [x] `localStorage` key mismatch: `pb_auth` → `pocketbase_auth` (Pocketbase SDK default)
- [x] `getFirstListItem` filter syntax: passing `{ filter: ... }` object instead of string argument
- [x] Trailing slashes missing on redirect URLs → added to all `window.location` calls
- [x] User creation required password fields → added random password generation for new sign-ups
- [x] `requestOTP` only works for existing users → added client-side user creation before OTP request

---

## 🧹 Remaining: Post-Cutover Cleanup

**Do these after 48 hours of stable production use.**

### 1. Cancel Supabase Project
- Log into Supabase dashboard
- Cancel the `mckzuxiwutlvxyxzaext` project
- This stops all billing for the old database

### 2. Remove Legacy Files from Repository
```bash
# Delete migration scripts (no longer needed)
rm scripts/migrate-users-to-pb.js
rm scripts/migrate-data-to-pb.js
rm scripts/fix-pb-id-field.js
rm scripts/fix-pb-users-id.js
rm scripts/fix-all-pb-collections.js
rm scripts/verify-pb-users.js
rm scripts/verify-pb-data.js
rm scripts/debug-supabase-schema.js
rm scripts/setup-pb-collections.js
rm -rf pb_migrations/

# Delete legacy Supabase code (after 1 week stability)
rm src/lib/supabase.ts

# Update package.json to remove @supabase/supabase-js if no longer needed anywhere
```

### 3. Clean Up GitHub Repository Variables
- Remove any remaining Supabase secrets from GitHub if they exist (e.g. `SUPABASE_SERVICE_ROLE_KEY`)
- Verify `PUBLIC_POCKETBASE_URL` and `PUBLIC_WORKER_URL` are the only public variables needed

### 4. Update Documentation
- Update `AGENTS.md` to remove references to Supabase migration
- Update `README.md` if it mentions Supabase anywhere
- Update this file (`migration.md`) to mark all cleanup items as done

### 5. Review `.env` Files
- Remove commented-out Supabase credentials from `.env`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are not in `.env` (they were needed for scripts only)

---

## Architecture Reference

### Auth Flow
- **Pocketbase OTP**: `requestOTP(email)` → sends email with `?otpId={OTP_ID}&code={OTP}` → `authWithOTP(otpId, code)`
- **Session stored in**: `localStorage` key `pocketbase_auth` (Pocketbase SDK default)
- **New user sign-up**: Client-side creates user with random password (required by PB auth collections), then requests OTP

### Data Access
- `pb.collection('lists').getList()` / `.create()` / `.update()` / `.delete()`
- `pb.collection('list_items').getFirstListItem(filterString)` — note: takes string, not `{ filter: ... }`
- `pb.collection('user_item_status').getList()` / `.create()` / `.update()`

### Schema Mapping
| Supabase Table | Pocketbase Collection | Notes |
|---|---|---|
| `auth.users` | `users` | Custom fields: `name`, `prefs`. OTP enabled. Create rule blank (open). |
| `public.lists` | `lists` | `user_id` → `user` relation. `created_at` autodate. |
| `public.list_items` | `list_items` | `list_id` → `list` relation. Cascade delete. Unique on `list, item_type, item_id`. |
| `public.user_item_status` | `user_item_status` | `user_id` → `user` relation. Cascade delete. Unique on `user, item_type, item_id`. |

---

## Environment Variables

### Current `.env` (Development)
```
PUBLIC_AUTH_PROVIDER=pocketbase
PUBLIC_POCKETBASE_URL=https://pb.giveback.guide
PUBLIC_WORKER_URL=https://newsletter-subscription.matt-c4f.workers.dev
```

### GitHub Repository Variables (Production)
- `PUBLIC_POCKETBASE_URL` = `https://pb.giveback.guide`
- `PUBLIC_WORKER_URL` = `https://newsletter-subscription.matt-c4f.workers.dev`
- `PUBLIC_AUTH_PROVIDER` = `pocketbase`

---

## Quick Reference

The migration is complete. No further action is needed unless issues arise.

Last updated: 4 August 2026
