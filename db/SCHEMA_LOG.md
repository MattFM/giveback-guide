# Pocketbase schema log

A running log of every schema-level change made to the Pocketbase collections. Update this file whenever you add or remove a field, change a rule, or backfill existing data. Use it as a recipe when onboarding a new machine or recovering from disaster.

## Format

Each entry below follows this shape. New entries go on top.

```markdown
## YYYY-MM-DD — short title

### What changed

- Collection `xxx` — added field `yyy` (Type: …, Required: …).
- Collection `zzz` — backfilled `field_a` for existing rows.

### Why

- Reason: …

### How to apply

1. Admin UI steps …
2. SQL backfill (run in the SQL console) …
3. Verify …

### Notes

- Anything the next person should know (migration gotcha, follow-up, deferral reason).
```

---

## Phase 1 — tier system & per-list fields

### What changed

- `users.prefs` (JSON object, already exists) — populates new keys `tier`, `tier_set_at`, `tier_source` for every existing row.
- `list_items` — adds `notes` (Text) and `position` (Number) columns.
- `lists` — adds `slug` (Text) column. Populated for new lists in Phase 5.

### Why

- `users.prefs.tier` drives the free-tier hard limit (3 lists / 100 saves per user).
- `list_items.notes` reserved for per-item notes (UI lands in Phase 5).
- `list_items.position` reserved for item ordering (UI lands in Phase 5).
- `lists.slug` reserved for friendly per-list URLs (`/account/lists/{slug}/`) in Phase 5.

### How to apply

#### 1 — Add fields via admin UI

Open `https://pb.giveback.guide/_/`.

a. Click the **`list_items`** collection → **Edit collection** → **Add field**:
   - Name: `notes`
   - Type: **Plain text**
   - Required: off
   - Save

b. Same screen → **Add field** again:
   - Name: `position`
   - Type: **Number**
   - Required: off
   - Save

c. Click the **`lists`** collection → **Edit collection** → **Add field**:
   - Name: `slug`
   - Type: **Plain text**
   - Required: off
   - Save

The `users` collection needs no field add — its `prefs` JSON bag already accepts new keys.

#### 2 — Backfill via SQL console

Open the admin UI **SQL console**. Paste and **Run** the first statement:

```sql
UPDATE users
SET prefs = json_set(
  IFNULL(prefs,'{}'),
  '$.tier','free',
  '$.tier_set_at', strftime('%s','now'),
  '$.tier_source','migration'
)
WHERE json_extract(prefs,'$.tier') IS NULL;
```

Paste and **Run** the second statement:

```sql
UPDATE list_items
SET position = CAST(strftime('%s', added_at) AS INTEGER)
WHERE position IS NULL;
```

Each statement is idempotent — re-running does nothing if the data is already set.

#### 3 — Verify

Run these and confirm the counts look right:

```sql
SELECT count(*) AS total_users FROM users;
SELECT count(*) AS users_without_tier FROM users WHERE json_extract(prefs,'$.tier') IS NULL;
SELECT count(*) AS list_items_without_position FROM list_items WHERE position IS NULL;
SELECT count(*) AS lists_without_slug FROM lists WHERE slug IS NULL;
```

Expected:

| Query | Expected | If not |
|-------|----------|--------|
| `total_users` | matches what you already know | — |
| `users_without_tier` | **0** | re-run the Step-2 first SQL |
| `list_items_without_position` | **0** | re-run the Step-2 second SQL |
| `lists_without_slug` | some NULLs OK | expected — populated for new lists in Phase 5 |

### Notes

- New users signing up after this point will have `tier='free'` written via `src/lib/billing.ts` → `setAccountTier('free','signup')`.
- `lists.slug` stays NULL on existing lists until Phase 5 (per-list-detail page lands). New lists created via the app will auto-generate slugs at that point.
- `list_items.position` is part of Phase 5 (per-item reorder). For now it isn't read or set by the app — only the backfill assigns it.
