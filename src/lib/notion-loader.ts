import type { Loader } from "astro/loaders";
import { Client, isFullPage, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import { unified } from "unified";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";

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
 * Recursively fetch all blocks for a Notion page.
 */
async function* listBlocks(
  client: Client,
  blockId: string
): AsyncGenerator<any, void, unknown> {
  for await (const block of iteratePaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  })) {
    if (!isFullBlock(block)) {
      continue;
    }
    if (block.has_children) {
      const children = [];
      for await (const child of listBlocks(client, block.id)) {
        children.push(child);
      }
      // @ts-ignore -- attach children to the block's typed content
      block[block.type].children = children;
    }
    yield block;
  }
}

/**
 * Render Notion blocks to HTML string using notion-rehype-k.
 */
async function renderBlocksToHtml(blocks: any[]): Promise<string> {
  const processor = unified().use(notionRehype).use(rehypeStringify);
  const vfile = await processor.process({ data: blocks });
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
  });

  const name = collectionName
    ? `notion-loader/${collectionName}`
    : "notion-loader";

  const CONCURRENT_RENDERS = 5;

  return {
    name,
    async load(ctx) {
      const { store, logger: log_db, parseData } = ctx;
      const existingPageIds = new Set(store.keys());

      log_db.info(
        `Loading database (found ${existingPageIds.size} pages in store)`
      );

      const pages = iteratePaginatedAPI(client.databases.query, {
        database_id,
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

        if (needsRender) {
          const filePath = `notion/${page.id}.md`;
          const data = await parseData({
            id: page.id,
            data: page,
            filePath,
          });

          const task = async () => {
            try {
              const blocks = [];
              for await (const block of listBlocks(client, page.id)) {
                blocks.push(block);
              }
              const html = await renderBlocksToHtml(blocks);
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
                `Failed to render page ${page.id.slice(0, 6)}: ${err instanceof Error ? err.message : String(err)}`
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
        } else {
          log_db.debug(`Skipped page ${page.id.slice(0, 6)}`);
        }
      }

      // Wait for all render operations to complete, with limited concurrency
      if (renderTasks.length > 0) {
        log_db.info(`Rendering ${renderTasks.length} updated pages`);
        await pLimitAll(renderTasks, CONCURRENT_RENDERS);
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
