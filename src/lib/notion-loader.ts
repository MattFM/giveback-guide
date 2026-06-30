import type { Loader } from "astro/loaders";
import { Client, isFullPage, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import { unified } from "unified";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";

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
      const renderPromises: Promise<void>[] = [];

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

          const renderPromise = (async () => {
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
          })();

          renderPromises.push(renderPromise);

          log_db.info(
            `${isCached ? "Updated" : "Created"} page ${page.id.slice(0, 6)}`
          );
        } else {
          log_db.debug(`Skipped page ${page.id.slice(0, 6)}`);
        }
      }

      // Wait for all render operations to complete
      if (renderPromises.length > 0) {
        log_db.info(`Rendering ${renderPromises.length} updated pages`);
        await Promise.all(renderPromises);
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
