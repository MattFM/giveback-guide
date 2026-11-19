#!/usr/bin/env node
/**
 * Notion backup.
 *
 * Creates a complete, schema-agnostic copy of the Projects and Stays databases
 * plus the lookup databases they relate to (Project Types, Impact Areas),
 * covering every row regardless of Status. Two layers are written per run:
 *
 *   raw/     exact Notion API payloads (page + block tree + schema). This is
 *            the fidelity backstop and what a future restore would use.
 *   export/  flat CSV/JSON for importing into another platform (Baserow), plus
 *            page bodies and the full option lists.
 *
 * Runs are written into the private backup repository, never into this repo,
 * and optionally committed and pushed. Nothing is ever written to Notion.
 */

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";
import { unified } from "unified";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(SCRIPT_DIR, "..");
const SITE_PACKAGE = JSON.parse(
  await readFile(path.join(SITE_ROOT, "package.json"), "utf8")
);

loadEnv({ path: path.join(SITE_ROOT, ".env"), quiet: true });

const NOTION_VERSION = "2025-09-03";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_BLOCK_DEPTH = 10;
const TOOL_NAME = "notion-backup";
const TOOL_VERSION = 1;
const LIST_DELIMITER = " | ";

/**
 * Row counts observed on 2026-11-19. A baseline, not a rule: these databases
 * are expected to grow. A difference is reported as a warning (or fails under
 * --strict-counts) so a sudden drop is never silent.
 */
const BASELINE = {
  capturedAt: "2026-11-19",
  rows: { projects: 1082, stays: 104, project_types: 12, impact_areas: 19 },
};

const DATABASES = [
  {
    key: "projects",
    envId: "PROJECTS_NOTION_DATABASE_ID",
    description: "Give Back Guide projects (all statuses)",
  },
  {
    key: "stays",
    envId: "STAYS_NOTION_DATABASE_ID",
    description: "Give Back Guide stays (all statuses)",
  },
];

/** Friendly keys for relation target databases, else derived from the title. */
const DISCOVERED_KEYS = {
  "Project Types": "project_types",
  "Impact Areas": "impact_areas",
};

const DERIVED_DEFS = [
  { key: "name", label: "Name" },
  { key: "recordId", label: "Record ID" },
  { key: "slug", label: "Slug" },
  { key: "notionUrl", label: "Notion URL" },
  { key: "archived", label: "Archived" },
  { key: "inTrash", label: "In Trash" },
  { key: "createdTime", label: "Created Time" },
  { key: "lastEditedTime", label: "Last Edited Time" },
  { key: "bodyHtml", label: "Body HTML" },
];

const HELP = `Notion backup

Usage: node scripts/notion-backup.mjs [options]

  --out <dir>        Write the run to <dir> instead of the backup repository.
  --no-push          Write and verify, but do not commit or push.
  --include-trash    Also query rows currently in the Notion trash.
  --skip-bodies      Do not fetch page blocks (faster, loses body content).
  --concurrency <n>  Parallel Notion requests (default 3, max 5).
  --limit <n>        Smoke test only: stop after n rows per database. Marks the
                     run incomplete and refuses to push.
  --verify <dir>     Re-verify an existing run offline. No writes.
  --verify-live      With --verify, also compare row counts against Notion.
  --strict-counts    Fail if a row count differs from the recorded baseline.
  --help             Show this message.`;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const log = {
  info: (message) => console.error(`[backup] ${message}`),
  warn: (message) => console.error(`[backup] warning: ${message}`),
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

function utcStamp(date = new Date()) {
  return date.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function compareText(a, b) {
  const left = String(a ?? "");
  const right = String(b ?? "");
  return left < right ? -1 : left > right ? 1 : 0;
}

function parseArgs(argv) {
  const options = {
    out: null,
    push: true,
    includeTrash: false,
    skipBodies: false,
    concurrency: 3,
    limit: null,
    verify: null,
    verifyLive: false,
    strictCounts: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw new Error(`${arg} requires a value`);
      return next;
    };
    switch (arg) {
      case "--":
        break;
      case "--out":
        options.out = path.resolve(value());
        break;
      case "--no-push":
        options.push = false;
        break;
      case "--include-trash":
        options.includeTrash = true;
        break;
      case "--skip-bodies":
        options.skipBodies = true;
        break;
      case "--concurrency":
        options.concurrency = Math.min(5, Math.max(1, Number(value())));
        break;
      case "--limit":
        options.limit = Math.max(1, Math.floor(Number(value())));
        break;
      case "--verify":
        options.verify = path.resolve(value());
        break;
      case "--verify-live":
        options.verifyLive = true;
        break;
      case "--strict-counts":
        options.strictCounts = true;
        break;
      case "--help":
      case "-h":
        console.log(HELP);
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isFinite(options.concurrency)) {
    throw new Error("--concurrency must be a number");
  }
  if (options.limit !== null && !Number.isFinite(options.limit)) {
    throw new Error("--limit must be a number");
  }
  if (options.out && options.push) {
    throw new Error(
      "--out writes outside the backup repository, so it cannot be combined " +
        "with a push. Add --no-push."
    );
  }
  return options;
}

// ---------------------------------------------------------------------------
// Notion client
// ---------------------------------------------------------------------------

function createNotionClient(token) {
  const base = "https://api.notion.com/v1";

  async function request(pathname, init = {}, attempt = 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(`${base}${pathname}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= 4) {
        if (error?.name === "AbortError") {
          throw new Error(
            `Notion request timed out after ${REQUEST_TIMEOUT_MS}ms (${pathname})`
          );
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
      await sleep(1000 * 2 ** attempt);
      return request(pathname, init, attempt + 1);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      if (attempt >= 5) {
        throw new Error(`Notion rate limit not cleared (${pathname})`);
      }
      await sleep(
        Number.isFinite(retryAfter)
          ? Math.max(1000, retryAfter * 1000)
          : 1000 * 2 ** attempt
      );
      return request(pathname, init, attempt + 1);
    }

    if (response.status >= 500 && attempt < 4) {
      await sleep(1000 * 2 ** attempt);
      return request(pathname, init, attempt + 1);
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        `Notion API ${pathname}: ${body?.message ?? response.statusText}`
      );
      error.status = response.status;
      error.code = body?.code;
      throw error;
    }
    return body;
  }

  async function paginate(pathname, { method = "GET", body } = {}) {
    const results = [];
    let cursor;
    do {
      let target = pathname;
      let init = {};
      if (method === "GET") {
        const params = new URLSearchParams({ page_size: "100" });
        if (cursor) params.set("start_cursor", cursor);
        target = `${pathname}?${params.toString()}`;
      } else {
        init = {
          method,
          body: JSON.stringify({
            ...body,
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
        };
      }
      const response = await request(target, init);
      results.push(...(response.results ?? []));
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);
    return results;
  }

  return {
    async resolveDatabase(databaseId) {
      const database = await request(`/databases/${databaseId}`);
      const dataSource = database.data_sources?.[0];
      if (!dataSource?.id) {
        throw new Error(`No data source found for database ${databaseId}`);
      }
      return { database, dataSourceId: dataSource.id };
    },
    getDataSource: (dataSourceId) => request(`/data_sources/${dataSourceId}`),
    queryAll: (dataSourceId, { inTrash = false } = {}) =>
      paginate(`/data_sources/${dataSourceId}/query`, {
        method: "POST",
        body: { page_size: 100, ...(inTrash ? { in_trash: true } : {}) },
      }),
    listBlockChildren: (blockId) =>
      paginate(`/blocks/${blockId}/children`),
  };
}

// ---------------------------------------------------------------------------
// Property conversion
// ---------------------------------------------------------------------------

function richTextToPlainText(richText) {
  if (!Array.isArray(richText)) return "";
  return richText
    .map((item) => {
      if (typeof item?.plain_text === "string") return item.plain_text;
      if (typeof item?.text?.content === "string") return item.text.content;
      if (item?.type === "equation") return item.equation?.expression ?? "";
      return "";
    })
    .join("");
}

function uniqueIdToString(uniqueId) {
  if (!uniqueId) return null;
  if (typeof uniqueId === "string") return uniqueId.trim() || null;
  if (typeof uniqueId === "number" || typeof uniqueId === "bigint") {
    return String(uniqueId);
  }
  if (typeof uniqueId === "object") {
    const prefix = String(uniqueId.prefix ?? "").trim();
    const number = String(uniqueId.number ?? "").trim();
    if (prefix && number) return `${prefix}-${number}`;
    if (number) return number;
  }
  return null;
}

function rollupItemValue(item) {
  if (!item) return null;
  switch (item.type) {
    case "title":
      return richTextToPlainText(item.title);
    case "rich_text":
      return richTextToPlainText(item.rich_text);
    case "select":
    case "status":
      return item[item.type]?.name ?? null;
    case "multi_select":
      return (item.multi_select ?? []).map((entry) => entry.name).join(", ");
    case "number":
      return item.number ?? null;
    case "date":
      return item.date?.start ?? null;
    case "people":
      return (item.people ?? []).map((person) => person.name ?? person.id).join(", ");
    case "relation":
      return (item.relation ?? []).map((entry) => entry.id).join(", ");
    case "url":
      return item.url ?? null;
    case "checkbox":
      return Boolean(item.checkbox);
    default:
      return null;
  }
}

function rollupValue(rollup) {
  if (!rollup) return null;
  switch (rollup.type) {
    case "array":
      return (rollup.array ?? [])
        .map(rollupItemValue)
        .filter((entry) => entry !== null && entry !== "");
    case "number":
      return rollup.number ?? null;
    case "date":
      return rollup.date?.start ?? null;
    case "string":
      return rollup.string ?? null;
    case "boolean":
      return Boolean(rollup.boolean);
    default:
      return null;
  }
}

function formulaValue(formula) {
  if (!formula) return null;
  switch (formula.type) {
    case "string":
      return formula.string ?? null;
    case "number":
      return formula.number ?? null;
    case "boolean":
      return Boolean(formula.boolean);
    case "date":
      return formula.date?.start ?? null;
    case "array":
      return (formula.array ?? [])
        .map(rollupItemValue)
        .filter((entry) => entry !== null && entry !== "");
    default:
      return null;
  }
}

/**
 * Resolve a Notion property to string | number | boolean | null | string[].
 * Unknown types are serialised and reported, never dropped.
 */
function portablePropertyValue(property, context) {
  if (!property) return null;

  switch (property.type) {
    case "title":
      return richTextToPlainText(property.title);
    case "rich_text":
      return richTextToPlainText(property.rich_text);
    case "unique_id":
      return uniqueIdToString(property.unique_id);
    case "select":
    case "status":
      return property[property.type]?.name ?? null;
    case "multi_select":
      return (property.multi_select ?? []).map((item) => item.name);
    case "relation":
      return (property.relation ?? []).map(
        (item) => context.relationNames.get(item.id) ?? item.id
      );
    case "rollup":
      return rollupValue(property.rollup);
    case "formula":
      return formulaValue(property.formula);
    case "date":
      return property.date?.start ?? null;
    case "created_time":
      return property.created_time ?? null;
    case "last_edited_time":
      return property.last_edited_time ?? null;
    case "url":
      return property.url ?? null;
    case "email":
      return property.email ?? null;
    case "phone_number":
      return property.phone_number ?? null;
    case "checkbox":
      return Boolean(property.checkbox);
    case "number":
      return property.number ?? null;
    case "people":
      return (property.people ?? []).map(
        (person) => person.name ?? person.id ?? "Unknown"
      );
    case "files":
      return (property.files ?? []).map((file) => {
        const url = file.file?.url ?? file.external?.url ?? "";
        return url ? `${file.name ?? "file"}: ${url}` : (file.name ?? "file");
      });
    case "created_by":
      return property.created_by?.name ?? property.created_by?.id ?? null;
    case "last_edited_by":
      return property.last_edited_by?.name ?? property.last_edited_by?.id ?? null;
    case "verification":
      return property.verification?.state ?? null;
    case "button":
      return null;
    default:
      context.unknownTypes.add(property.type);
      return JSON.stringify(property[property.type] ?? null);
  }
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function csvCell(value) {
  if (value === null || value === undefined) return "";
  let text;
  if (Array.isArray(value)) {
    text = value.map((entry) => String(entry ?? "")).join(LIST_DELIMITER);
  } else if (typeof value === "boolean") {
    text = value ? "true" : "false";
  } else {
    text = String(value);
  }
  if (/[",\r\n]/.test(text) || text !== text.trim()) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(columns, rows) {
  const lines = [columns.map((column) => csvCell(column)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

/** Minimal RFC 4180 parser, used by --verify. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

const renderProcessor = unified().use(notionRehype).use(rehypeStringify);

async function fetchBlockTree(client, blockId, depth = 0) {
  const children = await client.listBlockChildren(blockId);
  for (const block of children) {
    if (!block.has_children) continue;
    if (depth + 1 >= MAX_BLOCK_DEPTH) {
      log.warn(
        `Block depth limit reached at ${block.id} (${block.type}); children omitted`
      );
      continue;
    }
    const nested = await fetchBlockTree(client, block.id, depth + 1);
    if (block[block.type] && typeof block[block.type] === "object") {
      block[block.type].children = nested;
    }
  }
  return children;
}

async function renderBlocksToHtml(blocks) {
  if (blocks.length === 0) return "";
  const file = await renderProcessor.process({ data: blocks });
  return String(file);
}

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  let failure = null;

  async function run() {
    while (!failure) {
      const current = index++;
      if (current >= items.length) return;
      try {
        results[current] = await worker(items[current], current);
      } catch (error) {
        failure = error;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );
  if (failure) throw failure;
  return results;
}

// ---------------------------------------------------------------------------
// Backup repository
// ---------------------------------------------------------------------------

async function gh(args) {
  const { stdout } = await execFileAsync("gh", args, { cwd: SITE_ROOT });
  return stdout.trim();
}

async function resolveGitHubOwner() {
  if (process.env.BACKUP_REPO_OWNER) return process.env.BACKUP_REPO_OWNER;
  try {
    return await gh(["api", "user", "-q", ".login"]);
  } catch {
    throw new Error(
      "Could not determine the GitHub account. Set BACKUP_REPO_OWNER."
    );
  }
}

async function ensureBackupRepo(repoDir, repoSlug) {
  try {
    await readFile(path.join(repoDir, ".git", "HEAD"), "utf8");
    return;
  } catch {
    // Local repository does not exist yet.
  }

  let remoteExists = true;
  try {
    await gh(["repo", "view", repoSlug, "--json", "visibility"]);
  } catch {
    remoteExists = false;
  }

  if (!remoteExists) {
    log.info(`Creating private repository ${repoSlug}`);
    await gh([
      "repo",
      "create",
      repoSlug,
      "--private",
      "--description",
      "Off-site backups of Give Back Guide Notion databases",
    ]);
  }

  await mkdir(repoDir, { recursive: true });
  await execFileAsync("git", ["init", "-b", "main"], { cwd: repoDir });
  await writeFile(
    path.join(repoDir, "README.md"),
    [
      "# Give Back Guide — Notion backups",
      "",
      "Off-site backups of the Give Back Guide Notion databases. Each directory",
      "is one run, produced by `scripts/notion-backup.mjs` in the site repository.",
      "",
      "These files contain unpublished records and internal notes. Keep this",
      "repository private.",
      "",
      "See each run's `REPORT.md` for row counts and `export/README.md` for the",
      "Baserow import process.",
      "",
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    path.join(repoDir, ".gitignore"),
    ["*.partial", ".DS_Store"].join("\n") + "\n",
    "utf8"
  );
  await execFileAsync(
    "git",
    ["remote", "add", "origin", `https://github.com/${repoSlug}.git`],
    { cwd: repoDir }
  );
  await execFileAsync("git", ["add", "-A"], { cwd: repoDir });
  await execFileAsync("git", ["commit", "-m", "Initialise backup repository"], {
    cwd: repoDir,
  });
  await execFileAsync("git", ["push", "-u", "origin", "main"], { cwd: repoDir });
}

async function assertRepoIsPrivate(repoSlug) {
  const visibility = await gh([
    "repo",
    "view",
    repoSlug,
    "--json",
    "visibility",
    "-q",
    ".visibility",
  ]);
  if (visibility !== "PRIVATE") {
    throw new Error(
      `Refusing to push: ${repoSlug} is ${visibility || "unknown"}, not PRIVATE. ` +
        "Backups contain unpublished records and internal notes."
    );
  }
}

async function commitAndPush(repoDir, message) {
  const { stdout: status } = await execFileAsync(
    "git",
    ["status", "--porcelain"],
    { cwd: repoDir }
  );
  if (!status.trim()) {
    log.info("No changes to commit");
    return false;
  }
  await execFileAsync("git", ["add", "-A"], { cwd: repoDir });
  await execFileAsync("git", ["commit", "-m", message], { cwd: repoDir });
  await execFileAsync("git", ["push"], { cwd: repoDir });
  return true;
}

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

function plainTitle(title) {
  if (!Array.isArray(title)) return "";
  return title.map((item) => item.plain_text ?? "").join("").trim();
}

function findProperty(dataSource, predicate) {
  return (
    Object.entries(dataSource.properties ?? {}).find(([, property]) =>
      predicate(property)
    ) ?? null
  );
}

function titleProperty(dataSource) {
  return findProperty(dataSource, (property) => property.type === "title");
}

function slugProperty(dataSource) {
  return (
    Object.entries(dataSource.properties ?? {}).find(
      ([name, property]) =>
        property.type === "rich_text" && /slug$/i.test(name)
    ) ?? null
  );
}

function uniqueIdProperty(dataSource) {
  return findProperty(dataSource, (property) => property.type === "unique_id");
}

function statusProperty(dataSource) {
  const entries = Object.entries(dataSource.properties ?? {});
  return (
    entries.find(
      ([name, property]) =>
        (property.type === "status" || property.type === "select") &&
        name.toLowerCase() === "status"
    ) ??
    entries.find(([, property]) => property.type === "status") ??
    entries.find(([, property]) => property.type === "select") ??
    null
  );
}

function propertyColumns(dataSource) {
  const entries = Object.entries(dataSource.properties ?? {});
  const titleEntry = entries.find(([, property]) => property.type === "title");
  const rest = entries
    .filter(([, property]) => property.type !== "title")
    .sort(([a], [b]) => compareText(a, b));
  const ordered = titleEntry ? [titleEntry, ...rest] : rest;

  const columns = [];
  for (const [name, property] of ordered) {
    columns.push(name);
    if (property.type === "date") columns.push(`${name}__end`);
  }
  return columns;
}

// ---------------------------------------------------------------------------
// Row building
// ---------------------------------------------------------------------------

function buildRow(page, dataSource, context, columns, derived) {
  const properties = dataSource.properties ?? {};
  const values = new Map();

  const titleEntry = titleProperty(dataSource);
  const titleValue = titleEntry
    ? portablePropertyValue(page.properties[titleEntry[0]], context)
    : null;

  // The site's databases keep the display name in pName/sName; the title
  // property is often empty. Fall back so no record is exported nameless.
  const nameFallback = Object.entries(properties).find(
    ([name, property]) =>
      property.type === "rich_text" && /name$/i.test(name)
  );
  const fallbackValue = nameFallback
    ? portablePropertyValue(page.properties[nameFallback[0]], context)
    : null;

  const slugEntry = slugProperty(dataSource);
  const slugValue = slugEntry
    ? String(portablePropertyValue(page.properties[slugEntry[0]], context) ?? "")
        .trim()
        .replace(/\s+/g, " ")
    : "";

  const idEntry = uniqueIdProperty(dataSource);
  const recordId =
    (idEntry && uniqueIdToString(page.properties[idEntry[0]]?.unique_id)) ??
    page.id;

  const derivedValues = {
    name:
      String(titleValue ?? "").trim() ||
      String(fallbackValue ?? "").trim() ||
      "(untitled)",
    recordId,
    slug: slugValue,
    notionUrl: page.url ?? "",
    archived: Boolean(page.archived),
    inTrash: Boolean(page.in_trash),
    createdTime: page.created_time ?? null,
    lastEditedTime: page.last_edited_time ?? null,
    bodyHtml: context.bodyHtml.get(page.id) ?? "",
  };
  for (const def of derived) {
    values.set(def.column, derivedValues[def.key]);
  }

  for (const [name, property] of Object.entries(properties)) {
    values.set(name, portablePropertyValue(page.properties[name], context));
    if (property.type === "date") {
      values.set(`${name}__end`, page.properties[name]?.date?.end ?? null);
    }
  }

  return Object.fromEntries(
    columns.map((column) => [
      column,
      values.has(column) ? values.get(column) : null,
    ])
  );
}

function numericId(value) {
  const match = String(value ?? "").match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function sortRows(rows) {
  return rows.slice().sort((a, b) => {
    const idA = numericId(a["Record ID"]);
    const idB = numericId(b["Record ID"]);
    if (idA !== null && idB !== null && idA !== idB) return idB - idA;
    return compareText(a["Name"], b["Name"]);
  });
}

function countStatuses(pages, dataSource) {
  const statusEntry = statusProperty(dataSource);
  if (!statusEntry) {
    return { property: null, counts: {}, total: pages.length };
  }
  const [name, property] = statusEntry;
  const definitions =
    property.type === "status"
      ? property.status?.options ?? []
      : property.select?.options ?? [];
  const counts = new Map();

  for (const page of pages) {
    const value = page.properties[name]?.[property.type]?.name ?? "(empty)";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const optionNames = definitions.map((option) => option.name);
  for (const value of counts.keys()) {
    if (!optionNames.includes(value)) optionNames.push(value);
  }

  const ordered = {};
  for (const option of optionNames) ordered[option] = counts.get(option) ?? 0;
  return { property: name, counts: ordered, total: pages.length };
}

function buildLookups(pages, dataSource) {
  const lookups = {};
  for (const [name, property] of Object.entries(dataSource.properties ?? {})) {
    if (!["select", "status", "multi_select"].includes(property.type)) continue;

    const definitions =
      property.type === "multi_select"
        ? property.multi_select?.options ?? []
        : property.type === "status"
          ? property.status?.options ?? []
          : property.select?.options ?? [];
    const seen = new Map(definitions.map((option) => [option.name, 0]));

    for (const page of pages) {
      const value = page.properties[name];
      if (property.type === "multi_select") {
        for (const item of value?.multi_select ?? []) {
          seen.set(item.name, (seen.get(item.name) ?? 0) + 1);
        }
      } else {
        const selected = value?.[property.type]?.name;
        if (selected) seen.set(selected, (seen.get(selected) ?? 0) + 1);
      }
    }

    lookups[name] = {
      type: property.type,
      options: [...seen.entries()]
        .map(([optionName, count]) => ({ name: optionName, count }))
        .sort((a, b) => compareText(a.name, b.name)),
    };
  }
  return lookups;
}

// ---------------------------------------------------------------------------
// Main run
// ---------------------------------------------------------------------------

async function resolveDatabases(client) {
  const resolved = [];

  for (const database of DATABASES) {
    const databaseId = process.env[database.envId];
    if (!databaseId) {
      throw new Error(`${database.envId} is not set in .env`);
    }
    const { database: meta, dataSourceId } =
      await client.resolveDatabase(databaseId);
    const dataSource = await client.getDataSource(dataSourceId);
    resolved.push({
      key: database.key,
      description: database.description,
      databaseId,
      dataSourceId,
      title: plainTitle(meta.title) || database.key,
      meta,
      dataSource,
      discovered: false,
    });
  }

  const discovered = new Map();
  for (const database of resolved) {
    for (const property of Object.values(database.dataSource.properties ?? {})) {
      if (property.type !== "relation") continue;
      const targetId = property.relation?.data_source_id;
      if (!targetId || discovered.has(targetId)) continue;
      discovered.set(targetId, property.name);
    }
  }

  for (const [dataSourceId, propertyName] of discovered) {
    const dataSource = await client.getDataSource(dataSourceId);
    const title = plainTitle(dataSource.title) || propertyName;
    const key =
      DISCOVERED_KEYS[title] ??
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    resolved.push({
      key,
      description: `Lookup table related to ${propertyName}`,
      databaseId: dataSource.parent?.database_id ?? null,
      dataSourceId,
      title,
      meta: null,
      dataSource,
      discovered: true,
    });
  }

  return resolved;
}

async function buildRelationNameIndex(client, database, cache) {
  const names = new Map();
  const targets = new Set();
  for (const property of Object.values(database.dataSource.properties ?? {})) {
    if (property.type === "relation" && property.relation?.data_source_id) {
      targets.add(property.relation.data_source_id);
    }
  }

  for (const dataSourceId of targets) {
    if (!cache.has(dataSourceId)) {
      const dataSource = await client.getDataSource(dataSourceId);
      const titleName = titleProperty(dataSource)?.[0];
      const pages = await client.queryAll(dataSourceId);
      const mapping = new Map();
      for (const page of pages) {
        const title = titleName
          ? richTextToPlainText(page.properties[titleName]?.title)
          : "";
        mapping.set(page.id, title.trim() || page.id);
      }
      cache.set(dataSourceId, mapping);
    }
    for (const [id, name] of cache.get(dataSourceId)) names.set(id, name);
  }

  return names;
}

function collectNotArchivedAssets(page, blocks, sink) {
  const seen = new Set(sink.map((asset) => `${asset.pageId}:${asset.url}`));
  const inspect = (kind, holder) => {
    if (holder?.type !== "file" || !holder.file?.url) return;
    const key = `${page.id}:${holder.file.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    sink.push({
      pageId: page.id,
      pageUrl: page.url,
      kind,
      url: holder.file.url,
      expiresAt: holder.file.expiry_time ?? null,
    });
  };

  inspect("cover", page.cover);
  inspect("icon", page.icon);
  for (const block of blocks) {
    for (const type of ["image", "file", "pdf", "video", "audio"]) {
      if (block.type === type) inspect(`block:${type}`, block[type]);
    }
  }
}

async function writeRun(options) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set in .env");

  const client = createNotionClient(token);
  const stamp = utcStamp();

  let repoDir = null;
  let repoSlug = null;
  if (!options.out) {
    const owner = await resolveGitHubOwner();
    repoSlug =
      process.env.BACKUP_REPO_SLUG ?? `${owner}/giveback-guide-backups`;
    repoDir =
      process.env.BACKUP_REPO_DIR ??
      path.join(path.dirname(SITE_ROOT), "giveback-guide-backups");
  }

  const outDir = options.out ?? path.join(repoDir, stamp);
  if (isInside(SITE_ROOT, outDir)) {
    throw new Error(
      `Refusing to write inside the site repository (${SITE_ROOT}). ` +
        "Backups contain unpublished records and internal notes."
    );
  }

  if (options.push) {
    await ensureBackupRepo(repoDir, repoSlug);
    await assertRepoIsPrivate(repoSlug);
  } else if (repoDir) {
    await mkdir(repoDir, { recursive: true });
  }

  const partialDir = `${outDir}.partial`;
  const startedAt = new Date();
  log.info(`Backing up to ${outDir}`);
  await rm(partialDir, { recursive: true, force: true });
  await mkdir(partialDir, { recursive: true });

  const warnings = [];
  const notArchived = [];
  const relationCache = new Map();
  const runSummary = [];
  const allLookups = {};

  try {
    const databases = await resolveDatabases(client);

    for (const database of databases) {
      log.info(
        `[${database.key}] ${database.title} (data source ${database.dataSourceId.slice(0, 8)})`
      );

      const dbDir = path.join(partialDir, "raw", database.key);
      await mkdir(dbDir, { recursive: true });
      await writeJson(path.join(dbDir, "schema.json"), {
        key: database.key,
        title: database.title,
        databaseId: database.databaseId,
        dataSourceId: database.dataSourceId,
        database: database.meta,
        dataSource: database.dataSource,
      });

      let pages = await client.queryAll(database.dataSourceId);
      if (options.includeTrash) {
        try {
          const trashed = await client.queryAll(database.dataSourceId, {
            inTrash: true,
          });
          const seen = new Set(pages.map((page) => page.id));
          for (const page of trashed) {
            if (seen.has(page.id)) continue;
            seen.add(page.id);
            pages.push(page);
          }
        } catch (error) {
          warnings.push(
            `[${database.key}] Could not query trashed rows (${error.message}); continuing without them.`
          );
        }
      }

      const liveCount = pages.length;
      if (options.limit) pages = pages.slice(0, options.limit);

      const relationNames = await buildRelationNameIndex(
        client,
        database,
        relationCache
      );
      const context = {
        relationNames,
        unknownTypes: new Set(),
        bodyHtml: new Map(),
      };

      if (options.skipBodies) {
        for (const page of pages) collectNotArchivedAssets(page, [], notArchived);
      }

      if (!options.skipBodies) {
        let done = 0;
        await mapLimit(pages, options.concurrency, async (page) => {
          const blocks = await fetchBlockTree(client, page.id);
          if (blocks.length > 0) {
            context.bodyHtml.set(page.id, await renderBlocksToHtml(blocks));
          }
          collectNotArchivedAssets(page, blocks, notArchived);
          page.__blocks = blocks;
          done++;
          if (done % 100 === 0) {
            log.info(`[${database.key}] bodies ${done}/${pages.length}`);
          }
        });
      }

      const ndjson = pages.map((page) => serialisePage(page)).join("\n");
      await writeFile(
        path.join(dbDir, "pages.ndjson"),
        ndjson ? `${ndjson}\n` : "",
        "utf8"
      );

      const { columns, derived } = buildColumnList(
        database.dataSource,
        warnings,
        database.key
      );
      const rows = sortRows(
        pages.map((page) =>
          buildRow(page, database.dataSource, context, columns, derived)
        )
      );

      const exportDir = path.join(partialDir, "export");
      await mkdir(exportDir, { recursive: true });
      await writeFile(
        path.join(exportDir, `${database.key}.csv`),
        toCsv(columns, rows),
        "utf8"
      );
      await writeJson(path.join(exportDir, `${database.key}.json`), rows);

      if (context.unknownTypes.size > 0) {
        warnings.push(
          `[${database.key}] Unhandled property type(s): ${[...context.unknownTypes].join(", ")}. Values were serialised as JSON.`
        );
      }

      const status = countStatuses(pages, database.dataSource);
      allLookups[database.key] = buildLookups(pages, database.dataSource);

      for (const page of pages) delete page.__blocks;

      runSummary.push({
        key: database.key,
        title: database.title,
        description: database.description,
        databaseId: database.databaseId,
        dataSourceId: database.dataSourceId,
        rows: pages.length,
        liveRows: liveCount,
        truncated: pages.length !== liveCount,
        statusProperty: status.property,
        statusCounts: status.counts,
        columns,
        columnCount: columns.length,
        schemaHash: sha256(JSON.stringify(database.dataSource)),
        expectedRows: BASELINE.rows[database.key] ?? null,
      });

      log.info(
        `[${database.key}] ${pages.length} rows, ${columns.length} columns`
      );
    }

    await writeJson(path.join(partialDir, "export", "lookups.json"), allLookups);
    await writeFile(
      path.join(partialDir, "export", "README.md"),
      buildImportReadme(runSummary),
      "utf8"
    );

    const toolDir = path.join(partialDir, "tool");
    await mkdir(toolDir, { recursive: true });
    await copyFile(
      path.join(SCRIPT_DIR, "notion-backup.mjs"),
      path.join(toolDir, "notion-backup.mjs")
    );

    const totalRows = runSummary.reduce((sum, entry) => sum + entry.rows, 0);
    const incomplete = Boolean(options.limit) || options.skipBodies;

    reconcile(runSummary, warnings, {
      strict: options.strictCounts,
      allowTruncated: Boolean(options.limit),
    });

    const manifest = {
      tool: {
        name: TOOL_NAME,
        version: TOOL_VERSION,
        notionApiVersion: NOTION_VERSION,
        dependencies: toolDependencies(),
      },
      generatedAt: startedAt.toISOString(),
      durationSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
      site: {
        commit: await gitHead(),
        packageVersion: SITE_PACKAGE.version,
      },
      complete: !incomplete,
      notes: {
        limit: options.limit,
        skipBodies: options.skipBodies,
        includeTrash: options.includeTrash,
      },
      baseline: BASELINE,
      totals: { rows: totalRows, databases: runSummary.length },
      databases: runSummary,
      notArchivedAssets: notArchived,
      warnings,
    };

    await writeFile(
      path.join(partialDir, "REPORT.md"),
      buildReport(manifest),
      "utf8"
    );

    const fileHashes = await hashTree(partialDir, ["manifest.json"]);
    manifest.files = fileHashes;
    await writeJson(path.join(partialDir, "manifest.json"), manifest);

    await rename(partialDir, outDir);
    log.info(`Wrote ${totalRows} rows across ${runSummary.length} databases`);

    if (options.push && !incomplete) {
      await assertRepoIsPrivate(repoSlug);
      const pushed = await commitAndPush(
        repoDir,
        `Backup ${startedAt.toISOString()} (${totalRows} rows)`
      );
      log.info(pushed ? `Pushed to ${repoSlug}` : "Nothing to push");
    } else if (incomplete) {
      log.warn("Run marked incomplete; not pushed");
    }

    printSummary(runSummary, totalRows, outDir, warnings);
  } catch (error) {
    await rm(partialDir, { recursive: true, force: true });
    throw error;
  }
}

function serialisePage(page) {
  const { __blocks, ...raw } = page;
  // The block tree is what makes the raw layer restorable; null means the
  // bodies were skipped for this run rather than the page being empty.
  return JSON.stringify({ ...raw, blocks: __blocks ?? null });
}

function buildColumnList(dataSource, warnings, databaseKey) {
  const propertyNames = propertyColumns(dataSource);
  const derived = DERIVED_DEFS.map((def) => {
    if (!propertyNames.includes(def.label)) {
      return { ...def, column: def.label };
    }
    const column = `${def.label} (site)`;
    warnings.push(
      `[${databaseKey}] Property "${def.label}" collides with a derived column; the derived value is in "${column}".`
    );
    return { ...def, column };
  });
  return {
    columns: [...derived.map((def) => def.column), ...propertyNames],
    derived,
  };
}

function reconcile(runSummary, warnings, { strict = false, allowTruncated = false } = {}) {
  const problems = [];
  for (const entry of runSummary) {
    const expected = allowTruncated ? entry.rows : entry.liveRows;
    if (entry.statusProperty) {
      const sum = Object.values(entry.statusCounts).reduce((a, b) => a + b, 0);
      if (sum !== expected) {
        problems.push(
          `[${entry.key}] status counts sum to ${sum} but ${expected} rows exist`
        );
      }
    }
    if (entry.rows !== entry.liveRows) {
      const message = `[${entry.key}] wrote ${entry.rows} of ${entry.liveRows} rows (run truncated)`;
      if (allowTruncated) warnings.push(`${message} by --limit`);
      else problems.push(message);
    }
    if (entry.expectedRows !== null && entry.liveRows !== entry.expectedRows) {
      const message = `[${entry.key}] ${entry.liveRows} rows, baseline is ${entry.expectedRows} (${BASELINE.capturedAt})`;
      if (strict) problems.push(`${message}; --strict-counts is set`);
      else warnings.push(`${message}. Expected if the database has grown.`);
    }
  }
  if (problems.length) {
    throw new Error(`Reconciliation failed:\n- ${problems.join("\n- ")}`);
  }
}

function printSummary(runSummary, totalRows, outDir, warnings) {
  const lines = runSummary.map(
    (entry) =>
      `${entry.key.padEnd(14)} ${String(entry.rows).padStart(5)} rows  ${entry.columnCount} columns`
  );
  console.log(lines.join("\n"));
  console.log(`\nTotal: ${totalRows} rows`);
  console.log(`Output: ${outDir}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s) — see REPORT.md`);
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function buildReport(manifest) {
  const lines = [];
  lines.push("# Notion backup report", "");
  lines.push(`- Generated: ${manifest.generatedAt}`);
  lines.push(`- Complete: ${manifest.complete ? "yes" : "**no**"}`);
  lines.push(`- Total rows: **${manifest.totals.rows}**`);
  if (manifest.notes.limit) {
    lines.push(`- Smoke test limit: ${manifest.notes.limit} rows per database`);
  }
  if (manifest.notes.skipBodies) lines.push("- Page bodies: **skipped**");
  if (manifest.notes.includeTrash) lines.push("- Trashed rows: included");
  lines.push("", "## Row counts by status", "");

  for (const entry of manifest.databases) {
    lines.push(`### ${entry.title} — ${entry.rows} rows`, "");
    if (!entry.statusProperty) {
      lines.push("_No status property found._", "");
      continue;
    }
    lines.push("| Status | Rows |", "| --- | ---: |");
    for (const [status, count] of Object.entries(entry.statusCounts)) {
      lines.push(`| ${status} | ${count} |`);
    }
    const sum = Object.values(entry.statusCounts).reduce((a, b) => a + b, 0);
    lines.push(`| **Total** | **${sum}** |`, "");
    if (entry.expectedRows !== null && entry.liveRows !== entry.expectedRows) {
      lines.push(
        `> Row count differs from the ${BASELINE.capturedAt} baseline of ${entry.expectedRows}.`,
        ""
      );
    }
  }

  lines.push("## Warnings", "");
  if (manifest.warnings.length === 0) {
    lines.push("None.", "");
  } else {
    for (const warning of manifest.warnings) lines.push(`- ${warning}`);
    lines.push("");
  }

  lines.push("## Assets not archived", "");
  if (manifest.notArchivedAssets.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push(
      "Notion-hosted files use expiring URLs. Covers and icons are intentionally",
      "not downloaded; these are listed so an expiring link is never lost silently.",
      "",
      "| Page | Kind | Expires | URL |",
      "| --- | --- | --- | --- |"
    );
    for (const asset of manifest.notArchivedAssets) {
      lines.push(
        `| ${asset.pageId} | ${asset.kind} | ${asset.expiresAt ?? "—"} | ${asset.url} |`
      );
    }
    lines.push("");
  }

  lines.push(
    "## Integrity",
    "",
    "File sizes and SHA-256 checksums for every file in this run are recorded in",
    "`manifest.json`. Verify them with:",
    "",
    "```sh",
    "pnpm run notion:backup --verify <this directory>",
    "```",
    ""
  );
  return lines.join("\n");
}

function buildImportReadme(runSummary) {
  const lines = [
    "# Importing this backup into Baserow",
    "",
    "Each `<database>.csv` is a flat table: one row per record, one column per",
    "Notion property, plus these derived columns:",
    "",
    "- `Name` — display name (`pTitle`/`sTitle`, falling back to `pName`/`sName`)",
    "- `Record ID` — the Notion unique ID (`PRO-1175`, `STA-111`) or page ID",
    "- `Slug` — the site slug, trimmed",
    "- `Notion URL` — the original page URL",
    "- `Archived` / `In Trash` — booleans",
    "- `Created Time` / `Last Edited Time` — ISO 8601",
    "- `Body HTML` — the page body rendered to HTML, when present",
    "",
    "Multi-value cells (multi-select and relation properties) are joined with",
    `\`${LIST_DELIMITER.trim()}\` in CSV; the \`.json\` twin keeps real arrays.`,
    "`lookups.json` lists every select and multi-select option with its row",
    "count, including options with zero rows.",
    "",
    "## Suggested order",
    "",
    "1. Create one Baserow table per CSV, importing into a **new table**. All",
    "   columns arrive as text, the most predictable starting point.",
    "2. Convert `Status`, `pVerify`/`sVerify`, `Outreach Status` and similar",
    "   single-value columns to Single select. Baserow creates options from the",
    "   imported values; check them against `lookups.json` afterwards.",
    "3. Convert date columns (`*Published`, `*Created`, `*Updated`) to Date. The",
    "   `*__end` columns hold the optional end of a date range.",
    "4. Convert URL columns to URL and checkbox columns to Boolean.",
    "5. Convert `Body HTML` to a Long text field (it is HTML, not Markdown).",
    "6. Baserow does not reliably split delimited cells on import, so treat",
    "   multi-select and relation columns as text, or normalise them into",
    "   link-to-table fields using the option lists in `lookups.json`.",
    "",
    "Baserow's per-table import limit is 5,000 rows, so each table imports in a",
    "single file:",
    "",
    "| Table | Rows | Columns |",
    "| --- | ---: | ---: |",
  ];
  for (const entry of runSummary) {
    lines.push(`| \`${entry.key}.csv\` | ${entry.rows} | ${entry.columnCount} |`);
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function verifyRun(dir, { live = false } = {}) {
  log.info(`Verifying ${dir}`);
  const manifest = JSON.parse(
    await readFile(path.join(dir, "manifest.json"), "utf8")
  );
  const problems = [];

  for (const file of manifest.files) {
    let buffer;
    try {
      buffer = await readFile(path.join(dir, file.path));
    } catch {
      problems.push(`Missing file: ${file.path}`);
      continue;
    }
    if (buffer.length !== file.bytes) {
      problems.push(`Size mismatch: ${file.path}`);
    } else if (sha256(buffer) !== file.sha256) {
      problems.push(`Checksum mismatch: ${file.path}`);
    }
  }

  for (const entry of manifest.databases) {
    const ndjson = await readFile(
      path.join(dir, "raw", entry.key, "pages.ndjson"),
      "utf8"
    );
    const ndjsonRows = ndjson.split("\n").filter((line) => line.trim()).length;
    if (ndjsonRows !== entry.rows) {
      problems.push(
        `[${entry.key}] raw NDJSON has ${ndjsonRows} rows, manifest says ${entry.rows}`
      );
    }

    const csv = parseCsv(
      await readFile(path.join(dir, "export", `${entry.key}.csv`), "utf8")
    );
    const header = csv[0] ?? [];
    if (header.join(",") !== entry.columns.join(",")) {
      problems.push(`[${entry.key}] CSV header does not match the manifest`);
    }
    const csvRows = Math.max(0, csv.length - 1);
    if (csvRows !== entry.rows) {
      problems.push(
        `[${entry.key}] CSV has ${csvRows} data rows, manifest says ${entry.rows}`
      );
    }

    const jsonRows = JSON.parse(
      await readFile(path.join(dir, "export", `${entry.key}.json`), "utf8")
    );
    if (jsonRows.length !== entry.rows) {
      problems.push(
        `[${entry.key}] JSON has ${jsonRows.length} rows, manifest says ${entry.rows}`
      );
    }
  }

  const lookups = JSON.parse(
    await readFile(path.join(dir, "export", "lookups.json"), "utf8")
  );
  for (const entry of manifest.databases) {
    if (!entry.statusProperty) continue;
    const options = lookups[entry.key]?.[entry.statusProperty]?.options ?? [];
    const missing = Object.keys(entry.statusCounts).filter(
      (name) => name !== "(empty)" && !options.some((option) => option.name === name)
    );
    if (missing.length) {
      problems.push(
        `[${entry.key}] status option(s) missing from lookups: ${missing.join(", ")}`
      );
    }
  }

  if (live) {
    const token = process.env.NOTION_TOKEN;
    if (!token) throw new Error("NOTION_TOKEN is not set in .env");
    const client = createNotionClient(token);
    for (const entry of manifest.databases) {
      const current = await client.queryAll(entry.dataSourceId);
      const delta = current.length - entry.rows;
      console.log(
        `[${entry.key}] live ${current.length}, backed up ${entry.rows}` +
          (delta === 0
            ? " (unchanged)"
            : delta > 0
              ? ` (+${delta} since this run)`
              : ` (${delta} removed since this run)`)
      );
    }
  }

  if (problems.length) {
    console.error("VERIFY FAILED");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log("VERIFY PASSED");
  for (const entry of manifest.databases) {
    console.log(
      `${entry.key}: ${entry.rows} rows, ${entry.columnCount} columns`
    );
  }
  console.log(`Files checked: ${manifest.files.length}`);
  console.log(`Generated: ${manifest.generatedAt}`);
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function listFiles(root) {
  const results = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip OS metadata so checksums match on a fresh clone.
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else results.push(toPosix(path.relative(root, absolute)));
    }
  }
  await walk(root);
  return results.sort();
}

async function hashTree(root, exclude = []) {
  const files = await listFiles(root);
  const hashes = [];
  for (const file of files) {
    if (exclude.includes(file)) continue;
    const buffer = await readFile(path.join(root, file));
    hashes.push({ path: file, bytes: buffer.length, sha256: sha256(buffer) });
  }
  return hashes;
}

function toolDependencies() {
  const wanted = ["dotenv", "notion-rehype-k", "rehype-stringify", "unified"];
  const deps = {
    ...SITE_PACKAGE.dependencies,
    ...SITE_PACKAGE.devDependencies,
  };
  return Object.fromEntries(
    wanted.filter((name) => deps[name]).map((name) => [name, deps[name]])
  );
}

async function gitHead() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: SITE_ROOT,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.verify) {
    await verifyRun(options.verify, { live: options.verifyLive });
  } else {
    await writeRun(options);
  }
} catch (error) {
  console.error(`\nBackup failed: ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exitCode = 1;
}
