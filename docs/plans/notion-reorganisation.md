# Give Back Guide — Notion reorganisation action plan

**Created:** 11 November 2026
**Location:** `docs/plans/notion-reorganisation.md`
**State:** Ready to run. Nothing started.

Work top to bottom; total time ~60–75 minutes.
Do it in one sitting so the database is never in a half-migrated state.

---

## Phase 0 — Protect first (5 min)

- [ ] Open **Features Management** → `•••` (top right) → **Duplicate**.
- [ ] Rename the copy `Features Management (backup 2026-11-11)`.
- [ ] Leave the backup untouched. If anything looks wrong later, compare against it.

> This is also your first real backup. It doesn't solve the export problem, but it
> means today's restructure is reversible.

---

## Phase 1 — Schema changes (15 min)

### 1.1 Rename the status that hides decisions

- [ ] Click the **Status** property → edit options → rename `Thinking` to `Decision needed`.
- [ ] Colour it amber.

> "Thinking" allows an item to sit forever without a decision. "Decision needed"
> is a state with an owner and a date.

### 1.2 Add five properties

Add via `+` at the right edge of the table header:

| Property | Type | Options / notes |
|---|---|---|
| **Horizon** | Select | `Now` (green), `Next` (blue), `Parked` (grey) |
| **Outcome** | Text | One sentence: what changes for the reader or the business |
| **Effort** | Select | `S` (under a day), `M` (a few days), `L` (a week or more) |
| **Next action** | Text | One physical next step. If you can't write one, it's a decision |
| **Decision by** | Date | Only used when Status = `Decision needed` |

### 1.3 Extend Category

- [ ] Add `SEO` and `Ops` to the **Category** options.
- [ ] Optional: add `Content`.

### 1.3a Priority — keep it, but scope it

Do not delete **Priority**, but stop treating it as a global ranking.

- [ ] Rule: **Priority is only meaningful when `Horizon = Now`.** It is a tie-breaker
      between the five Now items, nothing more.
- [ ] Clear Priority on every `Next` and `Parked` row.
- [ ] Assign Priority only when promoting an item to `Now`, never at creation.

> Rationale: `Horizon` answers "when", `Priority` answers "which first of these five".
> Letting Priority apply globally creates two competing orderings — and produces
> incoherent rows like `High` + `Parked`, which is what makes the board feel stuck.
>
> Do **not** add a scoring formula (Impact × Effort, RICE, etc.). At 13 rows it is
> maintenance without benefit.

### 1.4 Tighten the dependency fields

- [ ] Keep **Blocked By** and **Enables**, but apply this rule from now on:
      every `Blocked By` target must itself exist as a row in the database.
- [ ] If a blocker does not exist as a row, create it and mark it `Parked`.

> A blocker you can't see is a blocker you can't make a decision about.

---

## Phase 2 — Views (10 min)

### 2.1 Working board (this becomes the default view)

- [ ] Duplicate the Kanban view, rename it **Roadmap**.
- [ ] Group by **Horizon** (not Status).
- [ ] Filter: `Horizon is not Parked`.
- [ ] Sort within columns by **Priority** (High → Low).
- [ ] Set as the default view for the database.

### 2.2 The only view you open during the week

- [ ] New view **Now** → Table.
- [ ] Filter: `Horizon is Now`.
- [ ] Show properties: Name, Status, Priority, Next action, Effort.
- [ ] Sort by Priority.

### 2.3 Decisions queue

- [ ] New view **Decisions** → Table.
- [ ] Filter: `Status is Decision needed`.
- [ ] Sort by **Decision by** ascending.

### 2.4 The shelf

- [ ] New view **Parked** → Table.
- [ ] Filter: `Horizon is Parked`.
- [ ] Show: Name, Outcome, Effort, Blocked By, Decision by.
- [ ] You open this once a month. Not before.

### 2.5 Hide finished work

- [ ] In **Roadmap**, filter `Status is not Done`.

---

## Phase 3 — Clean up the existing 13 rows (25 min)

For each row, set Horizon, Status, Effort, Outcome, Next action.

| # | Item | Horizon | Status | Effort | Next action |
|---|---|---|---|---|---|
| 1 | Priority by Country | Parked | Not started | L | Wait for trigger; blocked by Unified Locations database |
| 2 | User gamification | Parked | Not started | M | Decide if a saved-count milestone is enough (30 min) |
| 3 | Reconfigure "you might like" | **Now** | Not started | S | Pick 5 top-traffic posts; list the 3 items each should surface |
| 4 | Maps | Parked | Not started | L | None until trigger (see Tiered user pricing) |
| 5 | Listing "boost" | Parked | Not started | L | None until audience proof exists |
| 6 | Trips | Parked | Not started | L | None until affiliate revenue is proven |
| 7 | Database migration (Baserow) | Parked | Decision needed | M | Set Decision by = 2027-02-01 |
| 8 | Tiered user pricing | Parked | Not started | L | None until affiliate covers running costs |
| 9 | Listing page redesign | Next | Not started | M | Sketch the drawer's open/closed states |
| 10 | Advertising rollout | **Now** | Not started | M | **Retitle** "Affiliate links in ad slots" |
| 11 | Notion backup plans | **Now** | Not started | S | Choose export method: API script or scheduled manual |
| 12 | Payment processing | Parked | **Not started** | L | None — revisit with Tiered user pricing |
| 13 | SEO Audit | **Now** | Not started | M | Run the audit; turn findings into fix rows |

### 3.1 The one status correction that matters

- [ ] Change **Payment processing** from `In progress` to `Not started`.

> It isn't in progress. `src/lib/tier-limits.ts` defines free/pro limits and
> `src/lib/billing.ts` sets tier from a PocketBase preference — but nothing
> charges anyone. A permanently "in progress" item is a constant low-grade guilt
> source with no path to completion.

### 3.2 Three rows to add

- [ ] **Unified Locations database** — Parked, Effort L.
      Outcome: Projects, Stays and later Trips all reference one canonical place record.
      Next action: define the minimum field set (name, country, region, slug, coordinates).
- [ ] **Affiliate programme applications** — Now, Effort S.
      Outcome: approved accounts with at least one values-aligned partner.
      Next action: shortlist partners that pass the ethics test.
- [ ] **Blog → listing handoff** — Now, Effort S.
      Outcome: readers continue from an article into a relevant listing.
      Next action: list the top 20 posts and the listing each should link to.

---

## Phase 4 — Set the Now shelf (5 min)

The Now shelf must never hold more than five items. Yours should be:

1. SEO Audit
2. Affiliate links in ad slots
3. Affiliate programme applications
4. Reconfigure "you might like"
5. Blog → listing handoff
6. Notion backup plans

That's six — merge **Reconfigure "you might like"** into **Blog → listing handoff**
(the rework is one of its steps). Final Now shelf:

1. SEO Audit
2. Affiliate links in ad slots
3. Affiliate programme applications
4. Blog → listing handoff
5. Notion backup plans

- [ ] Move exactly **one** of these to `In progress`. Everything else stays `Not started`.

### 4.1 Priorities and effort

| # | Item | Priority | Effort | Estimate |
|---|---|---|---|---|
| 1 | Affiliate programme applications | **High** | S | 2–3 hrs |
| 2 | Affiliate links in ad slots | **High** | M | 10–16 hrs |
| 3 | SEO Audit | Medium | M (timeboxed 1.5 days) | 6–10 hrs |
| 4 | Blog → listing handoff | Medium | M | 8–12 hrs |
| 5 | Notion backup plans | Low | S | 1–2 hrs |

Total: **30–45 hours**, i.e. under three weeks at 20 hrs/week.

Two High items are the revenue path; two Medium items are the product path. That split
is correct *only* while the goal is covering running costs. When affiliate revenue works,
handoff and SEO move up.

### 4.2 Sequence (exploits affiliate lead times)

- [ ] **Day 1** — affiliate applications (2–3 hrs). Shortlist four programmes, not one:
      some reject small sites on traffic grounds and you want a guaranteed fallback.
- [ ] **Days 2–4** — build the affiliate plumbing while awaiting approval: link
      component, click tracking, disclosure styling. None of it requires approval.
- [ ] **Days 5–6** — SEO audit, timeboxed. Output = new `Parked`/`Next` rows, **not**
      an expanded Now shelf.
- [ ] **Day 7** — Notion backup, on a low-energy evening.
- [ ] **Week 2–3** — on approval, a single editing pass over the top 10 posts placing
      affiliate blocks *and* handoff links together. Never edit a post twice.

---

## Phase 5 — Write the operating rules down (5 min)

- [ ] Create a page inside the database: **How I run this**.
- [ ] Paste these six rules:

1. Max one `In progress`, max one `Decision needed`.
2. If it isn't on the Now shelf, it isn't late.
3. A row needs an Outcome and a Next action, or it's a decision.
4. `Parked` requires a written trigger. No trigger, no parking.
5. Weekly: open **Now**. Monthly: open **Parked**. Never the other way round.
6. Reminders holds actions. Notion holds decisions. Never both for the same thing.
7. Priority exists only inside `Now`. Blank everywhere else. No scores, no formulas.

- [ ] Add a recurring calendar block: **Sunday 18:00 — 30 min weekly review**.

---

## Phase 6 — Monthly maintenance (ongoing)

Once a month, open the **Parked** view and do one thing per row:

- Promote to `Next` — the trigger fired.
- Keep parked — write today's date in Decision by.
- Archive — it's no longer wanted.

No other action. This is what stops the shelf becoming a graveyard.
