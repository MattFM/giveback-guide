# Notion backup

Manual, on-demand backup of the Notion databases that feed this site, kept
outside Notion so the data survives anything happening to the account.

Nothing here runs automatically and nothing is written to Notion.

## What is backed up

| Database | Rows at 2026-11-19 | Notes |
| --- | ---: | --- |
| Projects | 1,082 | every Status, not just Published |
| Stays | 104 | every Status, not just Published |
| Project Types | 12 | relation target of `pTypes` |
| Impact Areas | 19 | relation target of `pImpacts`/`sImpacts` |

Status is a column, not a filter. The export contains `Published`, `Pending`,
`Incomplete`, `To Check`, `Repository`, `Closed`, `AI Query`, `AI Rejected`,
`Not Sure` and `Rejected` rows alike, and `lookups.json` records all 13 options
per database including the ones with zero rows.

Cover images and icons are deliberately not downloaded. If a page body ever
contains a Notion-hosted file, its URL is listed in the run's `REPORT.md` under
"Assets not archived" so an expiring link cannot disappear unnoticed.

## Running a backup

```bash
pnpm run notion:backup
```

The run lands in the private backup repository (default
`../giveback-guide-backups`, one directory per run), is verified, then committed
and pushed. Configuration:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BACKUP_REPO_DIR` | `../giveback-guide-backups` | Local clone of the private backup repository |
| `BACKUP_REPO_SLUG` | `<gh user>/giveback-guide-backups` | GitHub repository coordinates |
| `BACKUP_REPO_OWNER` | current `gh` account | Used to build the slug |

A full run is roughly 1,200 Notion requests and takes 5–10 minutes. It requires
`NOTION_TOKEN`, `PROJECTS_NOTION_DATABASE_ID` and `STAYS_NOTION_DATABASE_ID` in
`.env`, and `gh` authenticated for the push.

The script refuses to write anywhere inside this repository — the data includes
unpublished records and internal notes — and refuses to push unless the backup
repository is `PRIVATE`.

### Options

```text
--out <dir>        Write to <dir> instead of the backup repo (requires --no-push)
--no-push          Write and verify locally, do not commit or push
--include-trash    Also include rows in the Notion trash
--skip-bodies      Skip page blocks (faster, loses body content)
--concurrency <n>  Parallel Notion requests (default 3, max 5)
--limit <n>        Smoke test: n rows per database, marked incomplete, never pushed
--verify <dir>     Re-verify an existing run (offline)
--verify-live      With --verify, also report how Notion has changed since
--strict-counts    Fail if a row count differs from the baseline
--help
```

## What a run contains

```text
<timestamp>/
  manifest.json          counts, schema hashes, file checksums, warnings, tool version
  REPORT.md              per-status counts, warnings, assets not archived
  raw/<database>/schema.json     the data source definition as Notion returned it
  raw/<database>/pages.ndjson    one line per page: page object + block tree
  export/<database>.csv          flat table, one row per record
  export/<database>.json         same rows with real arrays, not delimited strings
  export/lookups.json            every select/multi-select option + row count
  export/README.md               Baserow import instructions for that run
  tool/notion-backup.mjs         the exact script that produced the run
```

`raw/` is the fidelity layer: the exact API payload plus the schema, which is
what a restore to Notion (or any other tool) would be built from. `export/` is
the portability layer for a move to Baserow or similar.

The portable rows add these derived columns before the Notion properties:

- `Name` — `pTitle`/`sTitle`, falling back to `pName`/`sName`
- `Record ID` — `PRO-1175` / `STA-111`, or the page ID for lookup tables
- `Slug`, `Notion URL`, `Archived`, `In Trash`
- `Created Time`, `Last Edited Time` — ISO 8601
- `Body HTML` — the page body rendered to HTML, when the page has one

If a Notion property already uses one of those names, the derived column is
suffixed `(site)` and a warning is recorded, so no data is overwritten.

Multi-value properties are joined with ` | ` in CSV and kept as arrays in JSON.
Relation properties are resolved to readable names rather than page IDs.

## Verifying a run

```bash
pnpm run notion:backup --verify ../giveback-guide-backups/<timestamp>
```

Checks every file against its recorded SHA-256 and size, and confirms that the
raw NDJSON, the CSV and the JSON all contain the same number of rows as the
manifest. Exits non-zero on any mismatch.

Add `--verify-live` to also report the current Notion row count against the
backup, without failing: a difference only means the database has changed since
that run.

Row counts are also reconciled at backup time: the per-status counts must sum to
the number of rows fetched, and the rows written must equal the rows fetched.

## Restoring to Notion

The `raw/` layer is the source of truth. Each `pages.ndjson` line is a Notion
page object with its block tree attached, and `schema.json` holds the property
definitions. A restore would:

1. recreate the databases and properties from `schema.json`;
2. recreate lookup rows (Project Types, Impact Areas) first, so relation IDs can
   be remapped;
3. create pages from each raw record, translating property payloads back to the
   API shapes in that same file;
4. append the stored block trees to the recreated pages.

Relations in the raw archive reference the original page IDs, so a restore must
build an old-ID → new-ID map as it recreates pages. The portable `export/` files
are easier to read but are a flattened projection; use them for a migration, not
a restore.

## Importing into Baserow

`export/README.md` in each run has the step-by-step version. In short:

1. import each `<database>.csv` into a new table (5,000-row import limit, so all
   four tables fit);
2. convert single-value columns to Single select, using `lookups.json` to check
   options;
3. convert date columns to Date (`*__end` holds the optional end of a range);
4. convert URL and checkbox columns;
5. handle multi-select and relation columns as text, or normalise them into
   link-to-table fields — Baserow does not reliably split delimited cells on
   import.

`Record ID` is stable across runs, so re-imports can match records instead of
duplicating them.

## Retention and security

Every run is kept; each is roughly 15 MB (most of it page-body HTML), and git
history is the retention policy. Backups contain unpublished records, internal
notes and AI notes, so:

- the backup repository must stay private (the script enforces this on push);
- do not commit backups into this repository (`backups/` is gitignored, and the
  script refuses to write there);
- once data has been pushed, removing it later needs a history rewrite.
