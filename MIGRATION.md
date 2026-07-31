# Pocketbase Migration Guide

## Current Status: DEVELOPMENT COMPLETE — READY FOR CUTOVER

All code changes are complete and tested locally. The `migrate-to-pocketbase` branch contains the full migration. This document tracks what is done and what remains for cutover day.

---

## ✅ Completed

### Code Migration (Branch: `migrate-to-pocketbase`)
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
- [x] `pb_migrations/1785800000_setup_giveback_collections.js` — Migration file (not used, but present)
- [x] `scripts/setup-pb-collections.js` — Collection setup script (deprecated, manual setup used instead)
- [x] `scripts/migrate-users-to-pb.js` — User bulk-import script (ready for cutover)

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

### Local Testing (All Passing)
- [x] OTP login flow works for new sign-ups (open beta)
- [x] OTP login flow works for returning users
- [x] Onboarding page saves `name` and `prefs` correctly
- [x] Dashboard loads saved lists and items
- [x] Saving projects/stays to lists works
- [x] Creating new lists works
- [x] Moving items between lists works
- [x] Marking items as visited (`is_completed`) works
- [x] Unmarking items as visited works
- [x] Logout works
- [x] Profile page loads and updates name

### Known Issues Fixed During Development
- [x] Safari syntax error: `async import` → patched `pocketbase` package in `node_modules`
- [x] Build failure: Vite trying to bundle `supabase.ts` → removed fallback import from `auth.ts`
- [x] `localStorage` key mismatch: `pb_auth` → `pocketbase_auth` (Pocketbase SDK default)
- [x] `getFirstListItem` filter syntax: passing `{ filter: ... }` object instead of string argument
- [x] Trailing slashes missing on redirect URLs → added to all `window.location` calls
- [x] User creation required password fields → added random password generation for new sign-ups
- [x] `requestOTP` only works for existing users → added client-side user creation before OTP request

---

## ⏳ Remaining: Cutover Day Tasks

### Pre-Cutover (Do Beforehand)
1. **Export Supabase data**
   - In Supabase dashboard: export `lists`, `list_items`, `user_item_status` as CSV
   - Keep Supabase project live until cutover is verified

2. **Push migration branch to GitHub**
   ```bash
   git push -u origin migrate-to-pocketbase
   ```

### Cutover Day (Do in One Sitting)
1. **Deploy maintenance mode on `main`**
   - Commit that hides login form, shows "back soon" message
   - Push to `main` → deploys immediately, blocks all writes

2. **Run user migration script**
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your-key
   export PB_URL=https://pb.giveback.guide
   export PB_ADMIN_EMAIL=your-admin-email
   export PB_ADMIN_PASSWORD=your-admin-password
   node scripts/migrate-users-to-pb.js
   ```
   - Creates 37 users with same UUIDs as Supabase, preserving `name` and `prefs`

3. **Import data CSVs into Pocketbase**
   - `lists` → Import `lists.csv`
   - `list_items` → Import `list_items.csv`
   - `user_item_status` → Import `user_item_status.csv`
   - Spot-check counts and user associations

4. **Merge migration branch and deploy**
   ```bash
   git checkout main
   git merge migrate-to-pocketbase
   git push origin main
   ```
   - GitHub Actions builds and deploys automatically

5. **Update GitHub repository variables**
   - Remove: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON`
   - Add: `PUBLIC_POCKETBASE_URL` = `https://pb.giveback.guide`
   - Ensure: `PUBLIC_AUTH_PROVIDER` = `pocketbase`

6. **Revert maintenance mode**
   - Remove the temporary login block commit
   - Push to `main`

7. **Verify**
   - Test login with existing user
   - Test login with new user (open beta)
   - Test saving to lists, marking as visited
   - Check dashboard stats

### Post-Cutover
- [ ] Cancel Supabase project (after 48h verification)
- [ ] Remove old Supabase env vars from GitHub entirely
- [ ] Delete `scripts/migrate-users-to-pb.js` from repo
- [ ] Delete `src/lib/supabase.ts` from repo (after 1 week stability)

---

## Rollback Plan

If anything goes wrong after cutover:
1. Revert the merge commit on `main`
2. Restore old GitHub repository variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON`)
3. Push → site rolls back to Supabase build
4. Supabase project remains live until explicitly cancelled

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

# Legacy — for migration script only
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=...
```

### GitHub Repository Variables (Production — update on cutover day)
- **Remove**: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON`
- **Add**: `PUBLIC_POCKETBASE_URL` = `https://pb.giveback.guide`
- **Keep**: `PUBLIC_AUTH_PROVIDER` = `pocketbase`

---

## Quick Reference: Picking Up This Migration

If resuming in a new chat:
1. You are on branch `migrate-to-pocketbase` (committed and pushed to GitHub)
2. Pocketbase instance is live at `pb.giveback.guide` with all collections configured
3. All code changes are committed — local testing is complete and passing
4. **Next action**: Cutover day (see ⏳ Remaining section above)
5. **No further code changes needed** unless testing reveals new issues

Last updated: 31 July 2026
