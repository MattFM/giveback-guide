import { defineCollection, z } from 'astro:content';
import { notionLoader, richTextToPlainText } from '@chlorinec-pkgs/notion-astro-loader';
import { notionPageSchema, propertySchema, transformedPropertySchema } from '@chlorinec-pkgs/notion-astro-loader/schemas';

// Safely access environment variables with fallbacks for type generation
function getEnvVar(name: string): string {
	try {
	  return import.meta.env[name] || 'placeholder-during-type-generation';
	} catch (e) {
	  return 'placeholder-during-type-generation';
	}
}

const posts = defineCollection({
	loader: notionLoader({
		auth: getEnvVar('NOTION_TOKEN'),
    database_id: getEnvVar('BLOG_NOTION_DATABASE_ID'),
	  // Optional: tell loader where to store downloaded aws images, relative to 'src' directory
	  // Default value is 'assets/images/notion'
	  // imageSavePath: 'assets/images/notion',
	  // Use Notion sorting and filtering with the same options like notionhq client
	  filter: {
		property: 'Status',
		select: { "equals": "Published" },
	  },
	}),
	schema: notionPageSchema({
		properties: z.object({
		  bTitle: transformedPropertySchema.title,
		  bTags: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  bSlug: transformedPropertySchema.rich_text,
		  bCoverImage: transformedPropertySchema.url,
		  bPublished: transformedPropertySchema.date,
		  bLastUpdated: transformedPropertySchema.date,
		  bDescription: transformedPropertySchema.rich_text,
		}),
	  }),
  });

  const projects = defineCollection({
	loader: notionLoader({
		auth: getEnvVar('NOTION_TOKEN'),
    database_id: getEnvVar('PROJECTS_NOTION_DATABASE_ID'),
	  // Optional: tell loader where to store downloaded aws images, relative to 'src' directory
	  // Default value is 'assets/images/notion'
	  // imageSavePath: 'assets/images/notion',
	  // Use Notion sorting and filtering with the same options like notionhq client
	  filter: {
		property: 'Status',
		select: { "equals": "Published" },
	  },
	}),
	schema: notionPageSchema({
		properties: z.object({
			  pTitle: transformedPropertySchema.title,
							// Prefer a custom Notion unique id property (pID) but keep it optional.
							// Normalize objects like { prefix: 'PRO', number: 777 } -> 'PRO-777'
							pID: propertySchema.unique_id.transform((prop: any) => {
								const raw = prop && (prop.unique_id ?? prop.unique_id?.id ?? prop.unique_id?.value ?? prop);
								function normalize(v: any): string | null {
									if (v === null || v === undefined) return null;
									if (typeof v === 'string') {
										const s = v.trim();
										return s === '' ? null : s;
									}
									if (typeof v === 'number' || typeof v === 'bigint') return String(v);
									if (typeof v === 'object') {
										// Known Notion custom id shape: { prefix: 'PRO', number: 777 }
										if ('prefix' in v && 'number' in v) {
											const pref = String(v.prefix || '').trim();
											const num = String(v.number ?? '').trim();
											if (pref && num) return `${pref}-${num}`;
										}
										// Common fallback fields
										if (v.id || v.name || v.value) {
											return String(v.id ?? v.name ?? v.value).trim();
										}
										try {
											const json = JSON.stringify(v);
											return json === '{}' ? null : json;
										} catch (e) {
											return null;
										}
									}
									return null;
								}
								return normalize(raw);
							}),
				  pCountry: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  pLocale: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  // Relation properties (actual relations to other databases)
		  pTypes: propertySchema.relation.optional(),
		  pImpacts: propertySchema.relation.optional(),
		  // Rollup properties for names (what we use in UI)
		  pTypesNames: propertySchema.rollup.optional().transform((value: any) => {
			// This should contain the names from the rollup property
			if (!value) return [];
			
			// Extract the rollup value based on type
			const rollupValue = value.rollup;
			if (!rollupValue) return [];
			
			// Handle array type rollups (multiple values)
			if (rollupValue.type === 'array' && Array.isArray(rollupValue.array)) {
			  return rollupValue.array.map((item: any) => {
				// Handle title type (most common for Name fields)
				if (item.type === 'title' && Array.isArray(item.title) && item.title[0]?.plain_text) {
				  return item.title[0].plain_text;
				}
				// Handle rich text type
				if (item.type === 'rich_text' && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
				  return item.rich_text[0].plain_text;
				}
				// Fallback for direct string values
				if (typeof item === 'string') return item;
				if (item?.plain_text) return item.plain_text;
				return null;
			  }).filter(Boolean);
			}
			
			// Handle single string value
			if (rollupValue.type === 'string') {
			  return [rollupValue.string];
			}
			
			return [];
		  }),
		  pImpactsNames: propertySchema.rollup.optional().transform((value: any) => {
			// This should contain the names from the rollup property
			if (!value) return [];
			
			// Extract the rollup value based on type
			const rollupValue = value.rollup;
			if (!rollupValue) return [];
			
			// Handle array type rollups (multiple values)
			if (rollupValue.type === 'array' && Array.isArray(rollupValue.array)) {
			  return rollupValue.array.map((item: any) => {
				// Handle title type (most common for Name fields)
				if (item.type === 'title' && Array.isArray(item.title) && item.title[0]?.plain_text) {
				  return item.title[0].plain_text;
				}
				// Handle rich text type
				if (item.type === 'rich_text' && Array.isArray(item.rich_text) && item.rich_text[0]?.plain_text) {
				  return item.rich_text[0].plain_text;
				}
				// Fallback for direct string values
				if (typeof item === 'string') return item;
				if (item?.plain_text) return item.plain_text;
				return null;
			  }).filter(Boolean);
			}
			
			// Handle single string value
			if (rollupValue.type === 'string') {
			  return [rollupValue.string];
			}
			
			return [];
		  }),
		  pOrganiser: transformedPropertySchema.rich_text,
		  pSlug: transformedPropertySchema.rich_text,
		  pCost: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  pFree: transformedPropertySchema.checkbox,
		  pURL: transformedPropertySchema.url,
		  pGYGURL: transformedPropertySchema.url,
		  pMapsURL: transformedPropertySchema.url,
		  pVerify: transformedPropertySchema.select,
		  pImageURL: transformedPropertySchema.url,
		  pPublished: transformedPropertySchema.date,
		  pReview: transformedPropertySchema.rich_text,
		  pGetInvolved: transformedPropertySchema.rich_text,
		}),
	  }),
  });

  const stays = defineCollection({
	loader: notionLoader({
		auth: getEnvVar('NOTION_TOKEN'),
    database_id: getEnvVar('STAYS_NOTION_DATABASE_ID'),
	  // Optional: tell loader where to store downloaded aws images, relative to 'src' directory
	  // Default value is 'assets/images/notion'
	  // imageSavePath: 'assets/images/notion',
	  // Use Notion sorting and filtering with the same options like notionhq client
	  filter: {
		property: 'Status',
		select: { "equals": "Published" },
	  },
	}),
	schema: notionPageSchema({
		properties: z.object({
			  sTitle: transformedPropertySchema.title,
							// Prefer a custom Notion unique id property (sID) but keep it optional.
							// Normalize objects like { prefix: 'STY', number: 123 } -> 'STY-123'
							sID: propertySchema.unique_id.transform((prop: any) => {
								const raw = prop && (prop.unique_id ?? prop.unique_id?.id ?? prop.unique_id?.value ?? prop);
								function normalize(v: any): string | null {
									if (v === null || v === undefined) return null;
									if (typeof v === 'string') {
										const s = v.trim();
										return s === '' ? null : s;
									}
									if (typeof v === 'number' || typeof v === 'bigint') return String(v);
									if (typeof v === 'object') {
										// Known Notion custom id shape: { prefix: 'STY', number: 123 }
										if ('prefix' in v && 'number' in v) {
											const pref = String(v.prefix || '').trim();
											const num = String(v.number ?? '').trim();
											if (pref && num) return `${pref}-${num}`;
										}
										// Common fallback fields
										if (v.id || v.name || v.value) {
											return String(v.id ?? v.name ?? v.value).trim();
										}
										try {
											const json = JSON.stringify(v);
											return json === '{}' ? null : json;
										} catch (e) {
											return null;
										}
									}
									return null;
								}
								return normalize(raw);
							}),
		  sCountry: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  sLocale: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  sCategory: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  sTypes: propertySchema.relation.optional().transform((value: any) => {
			// Extract names from the relation array inside the relation property
			if (!value?.relation || !Array.isArray(value.relation)) return [];
			return value.relation.map((item: any) => {
				// Try different patterns for extracting the relation item name
				return item?.Name || item?.name || item?.title || 
					   item?.properties?.Name?.title?.[0]?.plain_text || 
					   item?.properties?.title?.title?.[0]?.plain_text ||
					   (typeof item === 'string' ? item : '');
			}).filter(Boolean);
		  }),
		  sImpacts: propertySchema.relation.optional().transform((value: any) => {
			// Extract names from the relation array inside the relation property
			if (!value?.relation || !Array.isArray(value.relation)) return [];
			return value.relation.map((item: any) => {
				// Try different patterns for extracting the relation item name
				return item?.Name || item?.name || item?.title || 
					   item?.properties?.Name?.title?.[0]?.plain_text || 
					   item?.properties?.title?.title?.[0]?.plain_text ||
					   (typeof item === 'string' ? item : '');
			}).filter(Boolean);
		  }),
		  sFacilities: transformedPropertySchema.multi_select.transform((value) => Array.isArray(value) ? value : [value]),
		  sName: transformedPropertySchema.rich_text,
		  sType: transformedPropertySchema.multi_select,
		  sSlug: transformedPropertySchema.rich_text,
		  sURL: transformedPropertySchema.url,
		  sOtherURL: transformedPropertySchema.url,
		  sBookingURL: transformedPropertySchema.url,
		  sHotelsURL: transformedPropertySchema.url,
		  sAgodaURL: transformedPropertySchema.url,
		  sMapsURL: transformedPropertySchema.url,
		  sVerify: transformedPropertySchema.select,
		  sImageURL1: transformedPropertySchema.url,
		  sImageURL2: transformedPropertySchema.url,
		  sImageURL3: transformedPropertySchema.url,
		  sPublished: transformedPropertySchema.date,
		  sReview: transformedPropertySchema.rich_text,
		}),
	  }),
  });

export const collections = { posts, projects, stays };
