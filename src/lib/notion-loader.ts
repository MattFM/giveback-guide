import type { Loader } from "astro/loaders";
import { Client, isFullPage, iteratePaginatedAPI } from "@notionhq/client";

/**
 * Retry wrapper around native Node.js fetch to bypass the node-fetch@2
 * "Premature close" bug and handle transient Notion API failures.
 *
 * The previous loader depended on
 * @notionhq/client v2 which defaults to node-fetch@2. By passing this
 * custom fetch to the Client constructor, we use native fetch (gzip-safe)
 * with exponential-backoff retries instead.
 */
async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, init);
    if (response.status >= 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(url, init, retries - 1, delayMs * 2);
  }
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

      for await (const page of pages) {
        if (!isFullPage(page)) {
          continue;
        }
        pageCount++;

        const isCached = existingPageIds.delete(page.id);
        const existingPage = store.get(page.id);

        if (existingPage?.digest !== page.last_edited_time) {
          const filePath = `notion/${page.id}.md`;
          const data = await parseData({
            id: page.id,
            data: page,
            filePath,
          });

          store.set({
            id: page.id,
            digest: page.last_edited_time,
            data,
            filePath,
          });

          log_db.info(
            `${isCached ? "Updated" : "Created"} page ${page.id.slice(0, 6)}`
          );
        } else {
          log_db.debug(`Skipped page ${page.id.slice(0, 6)}`);
        }
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
