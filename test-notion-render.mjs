import { Client, isFullBlock, iteratePaginatedAPI } from "@notionhq/client";
import { unified } from "unified";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";

const client = new Client({ auth: process.env.NOTION_TOKEN });
// Use a real page ID from the projects database
// Let's fetch one page first to get its ID
async function getFirstPage() {
  const response = await client.databases.query({
    database_id: process.env.PROJECTS_NOTION_DATABASE_ID,
    filter: { property: "Status", select: { equals: "Published" } },
    page_size: 1,
  });
  return response.results[0]?.id;
}

async function* listBlocks(client, blockId) {
  for await (const block of iteratePaginatedAPI(client.blocks.children.list, { block_id: blockId })) {
    if (!isFullBlock(block)) continue;
    if (block.has_children) {
      const children = [];
      for await (const child of listBlocks(client, block.id)) {
        children.push(child);
      }
      block[block.type].children = children;
    }
    yield block;
  }
}

async function main() {
  const pageId = await getFirstPage();
  console.log("Page ID:", pageId);
  if (!pageId) return;
  
  const blocks = [];
  for await (const block of listBlocks(client, pageId)) {
    blocks.push(block);
  }
  console.log("Fetched", blocks.length, "blocks");
  if (blocks.length > 0) {
    console.log("First block type:", blocks[0].type);
    console.log("First block keys:", Object.keys(blocks[0]));
  }
  
  const processor = unified().use(notionRehype).use(rehypeStringify);
  const vfile = await processor.process({ data: blocks });
  const html = String(vfile);
  console.log("HTML length:", html.length);
  console.log("HTML preview:", html.slice(0, 800));
}

main().catch(console.error);
