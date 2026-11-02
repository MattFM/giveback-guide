import type { Loader } from "astro/loaders";
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
 * Tunables (overridable via env). Conservative defaults so dev startup
 * always completes within ~90s even when individual page renders stall.
 * None of these affect correctness — they bound resource use.
 */
const CONCURRENT_RENDERS = Number(
  process.env.NOTION_CONCURRENT_RENDERS ?? 2
);
const PER_PAGE_TIMEOUT_MS = Number(
  process.env.NOTION_PAGE_TIMEOUT_MS ?? 30_000
);
const TOTAL_TIMEOUT_MS = Number(
  process.env.NOTION_LOAD_TIMEOUT_MS ?? 90_000
);
const MAX_BLOCK_DEPTH = Number(
  process.env.NOTION_MAX_BLOCK_DEPTH ?? 10
);
const RENDER_BUDGET = process.env.NOTION_RENDER_BUDGET
  ? Number(process.env.NOTION_RENDER_BUDGET)
  : undefined;

/**
 * Race a promise against a timeout. If the timeout wins, the underlying
 * promise keeps running in the background but is no longer awaited; its
 * eventual settlement is harmless because no one holds a reference once
 * the call site has moved on.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        if (timer) clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Shared unified pipeline. Constructed once and reused across pages so we
 * don't pay the cost of plugin initialisation for every one of the render
 * tasks. Safe for the plugins in use here because each `process()` call
 * builds and discards its own hast/vfile tree.
 */
const renderProcessor = unified().use(notionRehype).use(rehypeStringify);

/**
 * Retry wrapper around native Node.js fetch with exponential backoff.
 * Handles 429 (rate limited) and 5xx (transient server errors).
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
      const response = await fetch(url, init);

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
 * The caller is responsible for wrapping this in a timeout via withTimeout.
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
    timeoutMs: 120000,
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
      let renderedCount = 0;
      const renderTasks: (() => Promise<void>)[] = [];

      for await (const page of pages) {
        if (!isFullPage(page)) {
          continue;
        }
        pageCount++;

        const isCached = existingPageIds.delete(page.id);
        const existingPage = store.get(page.id);

        // Re-render if page changed or if previously stored without rendered content
        const needsRender =
          existingPage?.digest !== page.last_edited_time ||
          !existingPage?.rendered;

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
            // Wrap the entire block-fetch + render in a per-page timeout so
            // a single stalled page cannot hold up the whole render pool.
            const html = await withTimeout(
              (async () => {
                const blocks: any[] = [];
                for await (const block of listBlocks(client, page.id)) {
                  blocks.push(block);
                }
                return renderBlocksToHtml(blocks);
              })(),
              PER_PAGE_TIMEOUT_MS,
              `Render page ${page.id.slice(0, 6)}`
            );
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
          `${isCached ? "Updated" : "Created"} page ${page.id.slice(0, 6)}`
        );
      }

      // Wait for all render operations to complete, with limited concurrency.
      // Wrap the whole pool in an overall timeout so a few pathological pages
      // cannot hang dev startup indefinitely; tasks that completed store their
      // HTML, tasks that didn't fall through to the catch handler in the task.
      if (renderTasks.length > 0) {
        log_db.info(`Rendering ${renderTasks.length} updated pages`);
        if (RENDER_BUDGET && renderTasks.length >= RENDER_BUDGET) {
          log_db.info(
            `(Render budget ${RENDER_BUDGET} applied; older pages deferred)`
          );
        }
        try {
          await withTimeout(
            pLimitAll(renderTasks, CONCURRENT_RENDERS),
            TOTAL_TIMEOUT_MS,
            `Notion loader overall (${renderTasks.length} pages)`
          );
        } catch (err) {
          log_db.warn(
            `Notion loader overall guard triggered after ${TOTAL_TIMEOUT_MS}ms: ${
              err instanceof Error ? err.message : String(err)
            }. Continuing with whatever rendered so far.`
          );
        }
        log_db.info(`Rendered ${renderedCount} pages`);
      }

      for (const deletedPageId of existingPageIds) {
        store.delete(deletedPageId);
        log_db.info(`Deleted page ${deletedPageId.slice(0, 6)}`);
      }

      log_db.info(
        `Loaded database (fetched ${pageCount} pages from API)`
      );
    },
  };
}
