import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { notionLoader } from "./lib/notion-loader";

// Safely access environment variables with fallbacks for type generation
function getEnvVar(name: string): string {
  try {
    return import.meta.env[name] || "placeholder-during-type-generation";
  } catch (e) {
    return "placeholder-during-type-generation";
  }
}

// MDX Blog Collection (content managed in codebase)
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    published: z.coerce.date(),
    lastUpdated: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().url().optional(),
  }),
});

// Helper function to extract plain text from rich text arrays
function richTextToPlainText(richText: any[]): string {
  if (!Array.isArray(richText)) return "";
  return richText.map((item) => item.plain_text || "").join("");
}

// Base property schemas that match Notion API responses
const basePropertySchema = {
  type: z.string(),
  id: z.string(),
};

// Standard Notion page icon schema
const iconSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("external"),
      external: z.object({ url: z.string().url() }),
    }),
    z.object({
      type: z.literal("file"),
      file: z.object({ url: z.string().url(), expiry_time: z.string().optional() }),
    }),
    z.object({
      type: z.literal("emoji"),
      emoji: z.string(),
    }),
  ])
  .nullable();

// Standard Notion page cover schema
const coverSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("external"),
      external: z.object({ url: z.string().url() }),
    }),
    z.object({
      type: z.literal("file"),
      file: z.object({ url: z.string().url(), expiry_time: z.string().optional() }),
    }),
  ])
  .nullable();

const projects = defineCollection({
  loader: notionLoader({
    auth: getEnvVar("NOTION_TOKEN"),
    database_id: getEnvVar("PROJECTS_NOTION_DATABASE_ID"),
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
  }),
  schema: z.object({
    icon: iconSchema,
    cover: coverSchema,
    archived: z.boolean(),
    in_trash: z.boolean(),
    url: z.string().url(),
    public_url: z.string().url().nullable(),
    properties: z.object({
      // Title property - extracts plain text from rich text array
      pTitle: z.object({
        ...basePropertySchema,
        type: z.literal("title"),
        title: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.title)),

      // Custom ID - normalizes { prefix, number } objects to strings like "PRO-777"
      pID: z.object({
        ...basePropertySchema,
        type: z.literal("unique_id"),
        unique_id: z.any(),
      }).transform((prop) => {
        const v = prop.unique_id;
        if (v === null || v === undefined) return null;
        if (typeof v === "string") {
          const s = v.trim();
          return s === "" ? null : s;
        }
        if (typeof v === "number" || typeof v === "bigint") return String(v);
        if (typeof v === "object") {
          // Known Notion custom id shape: { prefix: 'PRO', number: 777 }
          if ("prefix" in v && "number" in v) {
            const pref = String(v.prefix || "").trim();
            const num = String(v.number ?? "").trim();
            if (pref && num) return `${pref}-${num}`;
          }
          if (v.id || v.name || v.value) {
            return String(v.id ?? v.name ?? v.value).trim();
          }
          try {
            const json = JSON.stringify(v);
            return json === "{}" ? null : json;
          } catch (e) {
            return null;
          }
        }
        return null;
      }),

      // Multi-select - transforms to array of strings
      pCountry: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      pLocale: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      // Relation properties - array of page IDs
      pTypes: z.object({
        ...basePropertySchema,
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }).optional().transform((prop) => prop?.relation || []),

      pImpacts: z.object({
        ...basePropertySchema,
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }).optional().transform((prop) => prop?.relation || []),

      // Rollup properties - extracts names from related database items
      pTypesNames: z.object({
        ...basePropertySchema,
        type: z.literal("rollup"),
        rollup: z.any(),
      }).optional().transform((prop) => {
        if (!prop) return [];
        const rollupValue = prop.rollup;
        if (!rollupValue) return [];
        if (rollupValue.type === "array" && Array.isArray(rollupValue.array)) {
          return rollupValue.array
            .map((item: any) => {
              if (item.type === "title" && Array.isArray(item.title) && item.title[0]?.plain_text) {
                return item.title[0].plain_text;
              }
              if (item.type === "rich_text" && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
                return item.rich_text[0].plain_text;
              }
              if (typeof item === "string") return item;
              if (item?.plain_text) return item.plain_text;
              return null;
            })
            .filter(Boolean);
        }
        if (rollupValue.type === "string") {
          return [rollupValue.string];
        }
        return [];
      }),

      pImpactsNames: z.object({
        ...basePropertySchema,
        type: z.literal("rollup"),
        rollup: z.any(),
      }).optional().transform((prop) => {
        if (!prop) return [];
        const rollupValue = prop.rollup;
        if (!rollupValue) return [];
        if (rollupValue.type === "array" && Array.isArray(rollupValue.array)) {
          return rollupValue.array
            .map((item: any) => {
              if (item.type === "title" && Array.isArray(item.title) && item.title[0]?.plain_text) {
                return item.title[0].plain_text;
              }
              if (item.type === "rich_text" && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
                return item.rich_text[0].plain_text;
              }
              if (typeof item === "string") return item;
              if (item?.plain_text) return item.plain_text;
              return null;
            })
            .filter(Boolean);
        }
        if (rollupValue.type === "string") {
          return [rollupValue.string];
        }
        return [];
      }),

      // Rich text properties - extracts plain text
      pName: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.rich_text)),

      pSlug: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.rich_text)),

      pReview: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).optional().transform((prop) => prop ? richTextToPlainText(prop.rich_text) : ""),

      pGetInvolved: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).optional().transform((prop) => prop ? richTextToPlainText(prop.rich_text) : ""),

      // Checkbox property
      pFree: z.object({
        ...basePropertySchema,
        type: z.literal("checkbox"),
        checkbox: z.boolean(),
      }).transform((prop) => prop.checkbox),

      // URL properties
      pURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).transform((prop) => prop.url),

      pGYGURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      pViatorURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      pKlookURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      pMapsURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      pInstagramURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      pImageURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      // Select property
      pVerify: z.object({
        ...basePropertySchema,
        type: z.literal("select"),
        select: z.object({ id: z.string(), name: z.string(), color: z.string() }).nullable(),
      }).optional().transform((prop) => prop?.select?.name || null),

      // Date property
      pPublished: z.object({
        ...basePropertySchema,
        type: z.literal("date"),
        date: z.object({ start: z.string(), end: z.string().nullable(), time_zone: z.string().nullable() }).nullable(),
      }).optional().transform((prop) => prop?.date?.start ? new Date(prop.date.start) : null),
    }),
  }),
});

const stays = defineCollection({
  loader: notionLoader({
    auth: getEnvVar("NOTION_TOKEN"),
    database_id: getEnvVar("STAYS_NOTION_DATABASE_ID"),
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
  }),
  schema: z.object({
    icon: iconSchema,
    cover: coverSchema,
    archived: z.boolean(),
    in_trash: z.boolean(),
    url: z.string().url(),
    public_url: z.string().url().nullable(),
    properties: z.object({
      // Title property
      sTitle: z.object({
        ...basePropertySchema,
        type: z.literal("title"),
        title: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.title)),

      // Custom ID with normalization
      sID: z.object({
        ...basePropertySchema,
        type: z.literal("unique_id"),
        unique_id: z.any(),
      }).transform((prop) => {
        const v = prop.unique_id;
        if (v === null || v === undefined) return null;
        if (typeof v === "string") {
          const s = v.trim();
          return s === "" ? null : s;
        }
        if (typeof v === "number" || typeof v === "bigint") return String(v);
        if (typeof v === "object") {
          if ("prefix" in v && "number" in v) {
            const pref = String(v.prefix || "").trim();
            const num = String(v.number ?? "").trim();
            if (pref && num) return `${pref}-${num}`;
          }
          if (v.id || v.name || v.value) {
            return String(v.id ?? v.name ?? v.value).trim();
          }
          try {
            const json = JSON.stringify(v);
            return json === "{}" ? null : json;
          } catch (e) {
            return null;
          }
        }
        return null;
      }),

      // Multi-select properties
      sCountry: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      sLocale: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      sFacilities: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      sType: z.object({
        ...basePropertySchema,
        type: z.literal("multi_select"),
        multi_select: z.array(z.object({ id: z.string(), name: z.string(), color: z.string() })),
      }).transform((prop) => prop.multi_select.map((item) => item.name)),

      // Relation properties
      sTypes: z.object({
        ...basePropertySchema,
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }).optional().transform((prop) => prop?.relation || []),

      sImpacts: z.object({
        ...basePropertySchema,
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }).optional().transform((prop) => prop?.relation || []),

      // Rollup properties
      sTypesNames: z.object({
        ...basePropertySchema,
        type: z.literal("rollup"),
        rollup: z.any(),
      }).optional().transform((prop) => {
        if (!prop) return [];
        const rollupValue = prop.rollup;
        if (!rollupValue) return [];
        if (rollupValue.type === "array" && Array.isArray(rollupValue.array)) {
          return rollupValue.array
            .map((item: any) => {
              if (item.type === "title" && Array.isArray(item.title) && item.title[0]?.plain_text) {
                return item.title[0].plain_text;
              }
              if (item.type === "rich_text" && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
                return item.rich_text[0].plain_text;
              }
              if (typeof item === "string") return item;
              if (item?.plain_text) return item.plain_text;
              return null;
            })
            .filter(Boolean);
        }
        if (rollupValue.type === "string") {
          return [rollupValue.string];
        }
        return [];
      }),

      sImpactsNames: z.object({
        ...basePropertySchema,
        type: z.literal("rollup"),
        rollup: z.any(),
      }).optional().transform((prop) => {
        if (!prop) return [];
        const rollupValue = prop.rollup;
        if (!rollupValue) return [];
        if (rollupValue.type === "array" && Array.isArray(rollupValue.array)) {
          return rollupValue.array
            .map((item: any) => {
              if (item.type === "title" && Array.isArray(item.title) && item.title[0]?.plain_text) {
                return item.title[0].plain_text;
              }
              if (item.type === "rich_text" && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
                return item.rich_text[0].plain_text;
              }
              if (typeof item === "string") return item;
              if (item?.plain_text) return item.plain_text;
              return null;
            })
            .filter(Boolean);
        }
        if (rollupValue.type === "string") {
          return [rollupValue.string];
        }
        return [];
      }),

      // Rich text properties
      sName: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.rich_text)),

      sSlug: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).transform((prop) => richTextToPlainText(prop.rich_text)),

      sReview: z.object({
        ...basePropertySchema,
        type: z.literal("rich_text"),
        rich_text: z.array(z.any()),
      }).optional().transform((prop) => prop ? richTextToPlainText(prop.rich_text) : ""),

      // URL properties
      sURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).transform((prop) => prop.url),

      sOtherURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sBookingURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sHotelsURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sAgodaURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sMapsURL: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sImageURL1: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sImageURL2: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      sImageURL3: z.object({
        ...basePropertySchema,
        type: z.literal("url"),
        url: z.string().nullable(),
      }).optional().transform((prop) => prop?.url || null),

      // Select property
      sVerify: z.object({
        ...basePropertySchema,
        type: z.literal("select"),
        select: z.object({ id: z.string(), name: z.string(), color: z.string() }).nullable(),
      }).optional().transform((prop) => prop?.select?.name || null),

      // Date property
      sPublished: z.object({
        ...basePropertySchema,
        type: z.literal("date"),
        date: z.object({ start: z.string(), end: z.string().nullable(), time_zone: z.string().nullable() }).nullable(),
      }).optional().transform((prop) => prop?.date?.start ? new Date(prop.date.start) : null),

      // Checkbox property
      sStockPhoto: z.object({
        ...basePropertySchema,
        type: z.literal("checkbox"),
        checkbox: z.boolean(),
      }).optional().transform((prop) => prop?.checkbox || false),
    }),
  }),
});

export const collections = { blog, projects, stays };
