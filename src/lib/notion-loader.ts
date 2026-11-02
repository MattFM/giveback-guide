import type { Loader } from "astro/loaders";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// `@notionhq/client` v5 is published as CommonJS, so we import it as a
// default export and destructure the symbols we use. Named ESM imports
// would otherwise trip Vite's module-evaluate path.
import notionPkg from "@notionhq/client";
import { unified } from "unified";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";

const { Client, isFullPage, isFullBlock, iteratePaginatedAPI } = notionPkg;

/**
 * Notion API version `2025-09-03` (the default for SDK v5) restructured
 * /v1/databases into /v1/databases (the container) + /v1/data_sources
 * (the queryable tables). To query rows from a database id we now have to
 * first retrieve the database, pick a data source, then call
 * `dataSources.query` with the `data_source_id` parameter.
 *
 * This module-scope cache memoises the database → data-source resolution
 * so a single Notion API call covers both projects and stays loaders if
 * they share a database id (common when test data is reused), and avoids
 * resolving again on HMR reloads within the same dev process.
 */
const databaseToDataSourceCache = new Map<string, string>();

async function resolveDataSourceId(
  client: Client,
  databaseId: string,
  logDb: { warn: (msg: string) => void }
): Promise<string> {
  const cached = databaseToDataSourceCache.get(databaseId);
  if (cached) return cached;

  const db = await client.databases.retrieve({ database_id: databaseId });
  // v5 SDK returns `data_sources` as an array of objects with at least an `id`.
  const sources = (db as { data_sources?: Array<{ id: string }> }).data_sources;
  if (!sources || sources.length === 0) {
    logDb.warn(
      `Database ${databaseId} returned no data sources; cannot query.`
    );
    throw new Error(`No data source found for database ${databaseId}`);
  }
  const id = sources[0].id;
  databaseToDataSourceCache.set(databaseId, id);
  return id;
}

/**
 * Tunables (overridable via env).
 *
 * Concurrency is deliberately 5 rather than 2: the work is dominated by
 * Notion API latency (~250 ms per page) and Notion's rate limiter, while
 * the HTML renderer itself costs ~1 ms per page. Setting this too low
 * makes a cold sync take minutes instead of a minute.
 */
const CONCURRENT_RENDERS = Number(
  process.env.NOTION_CONCURRENT_RENDERS ?? 5
);
/**
 * Per-request timeout, enforced by `fetchOnce` with an AbortController.
 * It bounds a single HTTP attempt, not the whole retry sequence, so long
 * Notion 429 backoffs don't count against it.
 */
const REQUEST_TIMEOUT_MS = Number(
  process.env.NOTION_PAGE_TIMEOUT_MS ?? 30_000
);
const MAX_BLOCK_DEPTH = Number(
  process.env.NOTION_MAX_BLOCK_DEPTH ?? 10
);
const RENDER_BUDGET = process.env.NOTION_RENDER_BUDGET
  ? Number(process.env.NOTION_RENDER_BUDGET)
  : undefined;

// Emergency escape hatch only. Dev mode must show real Notion content,
// so this is never enabled by default. Placeholder output is tagged and
// is never written to the durable cache nor treated as valid content,
// which means disabling the flag restores real HTML on the next run.
const SKIP_HTML_RENDER =
  process.env.NOTION_SKIP_HTML_RENDER === "1" ||
  process.env.NOTION_SKIP_HTML_RENDER === "true";

const PLACEHOLDER_MARKER = "data-notion-blocks-placeholder";
const PLACEHOLDER_HTML =
  `<div ${PLACEHOLDER_MARKER} aria-hidden="true">` +
  "[Notion blocks rendered at production build time]" +
  "</div>";

/**
 * Durable render cache.
 *
 * Astro keeps content in `.astro/data-store.json`, which is disposable:
 * Astro clears it whenever the content config, Astro config or Astro
 * version changes, and it is lost if `.astro/` is deleted or a sync is
 * interrupted. This cache lives outside Astro's store in
 * `.cache/notion-render/` and is written per page as soon as that page
 * finishes rendering, so an empty Astro store can be rehydrated without
 * a single Notion block request.
 *
 * Entries are keyed by page id and validated against the page's
 * `last_edited_time` plus `RENDER_CACHE_VERSION`. Bump the version
 * whenever the block renderer changes in a way that invalidates output.
 */
const RENDER_CACHE_VERSION = 1;
const RENDER_CACHE_DIR = fileURLToPath(
  new URL("../../.cache/notion-render/", import.meta.url)
);

function renderCacheFile(pageId: string): string {
  return path.join(RENDER_CACHE_DIR, `${pageId}.json`);
}

async function readRenderCache(
  pageId: string,
  digest: string
): Promise<string | null> {
  try {
    const raw = await readFile(renderCacheFile(pageId), "utf8");
    const parsed = JSON.parse(raw) as {
      v?: number;
      digest?: string;
      html?: string;
    };
    if (
      parsed.v !== RENDER_CACHE_VERSION ||
      parsed.digest !== digest ||
      typeof parsed.html !== "string" ||
      parsed.html.includes(PLACEHOLDER_MARKER)
    ) {
      return null;
    }
    return parsed.html;
  } catch {
    return null;
  }
}

async function writeRenderCache(
  pageId: string,
  digest: string,
  html: string
): Promise<void> {
  // Never persist placeholders: they must not survive into a later run.
  if (html.includes(PLACEHOLDER_MARKER)) return;
  try {
    await mkdir(RENDER_CACHE_DIR, { recursive: true });
    const file = renderCacheFile(pageId);
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(
      tmp,
      JSON.stringify({ v: RENDER_CACHE_VERSION, digest, html }),
      "utf8"
    );
    await rename(tmp, file);
  } catch {
    // A cache-write failure must never fail the content sync.
  }
}

/**
 * Shared unified pipeline. Constructed once and reused across pages so we
 * don't pay the cost of plugin initialisation for every one of the render
 * tasks. Safe for the plugins in use here because each `process()` call
 * builds and discards its own hast/vfile tree.
 */
const renderProcessor = unified().use(notionRehype).use(rehypeStringify);

/**
 * A single request attempt with a hard timeout. The AbortController
 * actually cancels the socket, unlike a race against a timer.
 */
async function fetchOnce(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Request to Notion API timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retry wrapper around native Node.js fetch with exponential backoff.
 * Handles 429 (rate limited) and 5xx (transient server errors).
 *
 * The timeout applies to each individual HTTP attempt, not to the whole
 * retry sequence. That distinction matters: Notion's 429 responses can
 * ask us to wait tens of seconds before retrying, and a timeout that
 * covered the backoff would abort perfectly healthy requests. Every
 * attempt is actively cancelled via AbortController, so a hung socket
 * cannot hold a render slot indefinitely.
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 5,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchOnce(url, init);

      // Rate limited — respect Retry-After header if available
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        let delayMs = baseDelayMs * Math.pow(2, attempt);

        if (retryAfter) {
          const retryAfterSeconds = parseFloat(retryAfter);
          if (!isNaN(retryAfterSeconds)) {
            delayMs = Math.max(1000, retryAfterSeconds * 1000);
          }
        }

        lastError = new Error(
          `HTTP 429: Rate limited (Retry-After: ${retryAfter}).`
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }

      // Server errors — exponential backoff
      if (response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelayMs * Math.pow(2, attempt))
          );
          continue;
        }
        break;
      }

      return response;
    } catch (error) {
      // Network errors — exponential backoff
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError ?? new Error("Unknown error in fetchWithRetry");
}

/**
 * Execute a list of async tasks with a maximum concurrency limit.
 * Rejects immediately if any task fails (like Promise.all).
 */
function pLimitAll<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    let index = 0;
    let activeCount = 0;
    let completedCount = 0;
    let rejected = false;
    const results: T[] = new Array(tasks.length);

    function runNext() {
      if (rejected) return;
      const current = index++;
      if (current >= tasks.length) {
        if (activeCount === 0 && completedCount === tasks.length) {
          resolve(results);
        }
        return;
      }

      activeCount++;
      tasks[current]().then(
        (value) => {
          if (rejected) return;
          results[current] = value;
          activeCount--;
          completedCount++;
          if (completedCount === tasks.length) {
            resolve(results);
          } else {
            runNext();
          }
        },
        (err) => {
          if (!rejected) {
            rejected = true;
            reject(err);
          }
        }
      );
    }

    for (let i = 0; i < Math.min(limit, tasks.length); i++) {
      runNext();
    }
  });
}

/**
 * Loader options — kept compatible with the original notion-astro-loader
 * so content.config.ts requires zero changes.
 */
export interface NotionLoaderOptions {
  auth: string;
  database_id: string;
  filter?: Record<string, unknown>;
  sorts?: unknown[];
  archived?: boolean;
  collectionName?: string;
  imageSavePath?: string;
  [key: string]: unknown;
}

/**
 * Recursively fetch all blocks for a Notion page. Depth is capped to
 * prevent pathological nesting from triggering runaway block-fetches.
 */
async function* listBlocks(
  client: Client,
  blockId: string,
  depth = 0,
  maxDepth = MAX_BLOCK_DEPTH
): AsyncGenerator<any, void, unknown> {
  for await (const block of iteratePaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  })) {
    if (!isFullBlock(block)) {
      continue;
    }
    if (block.has_children) {
      const children: any[] = [];
      if (depth + 1 < maxDepth) {
        for await (const child of listBlocks(client, block.id, depth + 1, maxDepth)) {
          children.push(child);
        }
      }
      // @ts-ignore -- attach children to the block's typed content
      block[block.type].children = children;
    }
    yield block;
  }
}

/**
 * Render Notion blocks to HTML string using the shared unified pipeline.
 * This is cheap (~1 ms per page); the cost of a sync is the Notion block
 * fetch, not the renderer.
 */
async function renderBlocksToHtml(blocks: any[]): Promise<string> {
  const vfile = await renderProcessor.process({ data: blocks });
  return String(vfile);
}

export function notionLoader(options: NotionLoaderOptions): Loader {
  const {
    database_id,
    filter,
    sorts,
    archived,
    collectionName,
    ...clientOptions
  } = options;

  const client = new Client({
    ...clientOptions,
    fetch: fetchWithRetry as any,
    // Outer backstop only: `fetchOnce` already enforces a per-attempt
    // timeout and actively aborts the socket. The SDK's timeout races the
    // whole retry sequence (including 429 backoff sleeps), so it must be
    // generous enough not to abort legitimate retries.
    timeoutMs: REQUEST_TIMEOUT_MS * 8,
    // Pin the Notion API version so future SDK upgrades don't silently
    // switch us to a different (potentially slower or differently rate-
    // limited) version. "2025-09-03" is the SDK 5.x default and the lowest
    // version supported by the v5 line.
    notionVersion: "2025-09-03",
  });

  const name = collectionName
    ? `notion-loader/${collectionName}`
    : "notion-loader";

  return {
    name,
    async load(ctx) {
      const { store, logger: log_db, parseData } = ctx;
      const existingPageIds = new Set(store.keys());

      log_db.info(
        `Loading database (found ${existingPageIds.size} pages in store)`
      );

      // Resolve the data-source id for this database (v5 SDK API), then
      // iterate pages through dataSources.query. One extra round-trip per
      // load; cached at module scope across loader instances.
      const dataSourceId = await resolveDataSourceId(
        client,
        database_id,
        log_db
      );
      const pages = iteratePaginatedAPI(client.dataSources.query, {
        data_source_id: dataSourceId,
        filter,
        sorts,
        archived,
      });

      let pageCount = 0;
      let cachedCount = 0;
      let renderedCount = 0;
      let failedCount = 0;
      const renderTasks: (() => Promise<void>)[] = [];

      for await (const page of pages) {
        if (!isFullPage(page)) {
          continue;
        }
        pageCount++;

        const wasInStore = existingPageIds.delete(page.id);
        const existingPage = store.get(page.id);

        // A placeholder is never valid content: it means a previous run
        // explicitly opted out of rendering. Treat it as stale so the real
        // renderer replaces it as soon as the flag is removed.
        const hasPlaceholder =
          typeof existingPage?.rendered?.html === "string" &&
          existingPage.rendered.html.includes(PLACEHOLDER_MARKER);

        // Re-render if the page changed, was never rendered, or only has
        // placeholder HTML.
        const needsRender =
          existingPage?.digest !== page.last_edited_time ||
          !existingPage?.rendered ||
          hasPlaceholder;

        if (!needsRender) {
          log_db.debug(`Skipped page ${page.id.slice(0, 6)}`);
          continue;
        }

        const filePath = `notion/${page.id}.md`;
        const data = await parseData({
          id: page.id,
          data: page,
          filePath,
        });

        // Rehydrate from the durable cache before touching the Notion API.
        // This is what makes dev startup fast even after Astro has cleared
        // or lost `.astro/data-store.json`.
        const cachedHtml = await readRenderCache(
          page.id,
          page.last_edited_time
        );
        // An empty string is a legitimate render result for a page with no
        // body blocks, so distinguish it from a cache miss (`null`).
        if (cachedHtml !== null) {
          store.delete(page.id);
          store.set({
            id: page.id,
            digest: page.last_edited_time,
            data,
            rendered: { html: cachedHtml },
            filePath,
          });
          cachedCount++;
          log_db.debug(`Cache hit for page ${page.id.slice(0, 6)}`);
          continue;
        }

        // Apply render budget: only queue tasks up to the configured cap so
        // dev startup doesn't spend all its time on Notion rendering while
        // you're iterating on UI. Pages that exceed the budget still get
        // their validated `data` stored (so they remain queryable via
        // getCollection); only the Notion→HTML render is skipped.
        if (RENDER_BUDGET && renderTasks.length >= RENDER_BUDGET) {
          log_db.info(
            `Deferred page ${page.id.slice(0, 6)} (over render budget, data only)`
          );
          store.delete(page.id);
          store.set({
            id: page.id,
            digest: page.last_edited_time,
            data,
            filePath,
          });
          continue;
        }

        const task = async () => {
          try {
            let html: string;
            if (SKIP_HTML_RENDER) {
              // Emergency escape hatch only. The placeholder is tagged and
              // is deliberately not written to the durable cache.
              html = PLACEHOLDER_HTML;
            } else {
              const blocks: any[] = [];
              for await (const block of listBlocks(client, page.id)) {
                blocks.push(block);
              }
              html = await renderBlocksToHtml(blocks);
              // Persist immediately so an interrupted sync resumes here
              // next time instead of re-fetching this page.
              await writeRenderCache(
                page.id,
                page.last_edited_time,
                html
              );
            }
            // Force Astro to accept the update by deleting the stale entry first
            store.delete(page.id);
            store.set({
              id: page.id,
              digest: page.last_edited_time,
              data,
              rendered: { html },
              filePath,
            });
            renderedCount++;
          } catch (err) {
            failedCount++;
            log_db.warn(
              `Failed to render page ${page.id.slice(0, 6)}: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            // Store without rendered content so the page still builds
            store.delete(page.id);
            store.set({
              id: page.id,
              digest: page.last_edited_time,
              data,
              filePath,
            });
          }
        };

        renderTasks.push(task);

        log_db.info(
          `${wasInStore ? "Updated" : "Created"} page ${page.id.slice(0, 6)}`
        );
      }

      // Wait for all render operations to complete. There is deliberately
      // no overall timeout: abandoning the pool leaves the Astro store
      // partial, so the next start pays the same cost again. Each HTTP
      // attempt has its own AbortController-based timeout instead.
      if (renderTasks.length > 0) {
        log_db.info(
          `Rendering ${renderTasks.length} updated pages (${cachedCount} from cache)`
        );
        if (RENDER_BUDGET && renderTasks.length >= RENDER_BUDGET) {
          log_db.info(
            `(Render budget ${RENDER_BUDGET} applied; older pages deferred)`
          );
        }
        await pLimitAll(renderTasks, CONCURRENT_RENDERS);
        log_db.info(
          `Rendered ${renderedCount} pages${
            failedCount ? ` (${failedCount} failed)` : ""
          }`
        );
      }

      for (const deletedPageId of existingPageIds) {
        store.delete(deletedPageId);
        log_db.info(`Deleted page ${deletedPageId.slice(0, 6)}`);
      }

      log_db.info(
        `Loaded database (fetched ${pageCount} pages from API; ` +
          `${cachedCount} cache hits, ${renderedCount} rendered` +
          `${failedCount ? `, ${failedCount} failed` : ""})`
      );
    },
  };
}
