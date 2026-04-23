import type { Loader } from "astro/loaders";
import { notionLoader as baseNotionLoader } from "@chlorinec-pkgs/notion-astro-loader";

/**
 * Wrapper around the notion-astro-loader that removes the deprecated
 * function-based schema to eliminate Astro 6 warnings.
 * 
 * The original loader defines schema as an async function, which Astro 6
 * deprecated in favor of createSchema(). Since we define our own schemas
 * explicitly in content.config.ts, we don't need the loader's auto-generated
 * schema anyway.
 */
export function notionLoader(options: Parameters<typeof baseNotionLoader>[0]): Loader {
  const baseLoader = baseNotionLoader(options);
  
  // Return the loader without the problematic schema function
  // Our explicit schema in content.config.ts will be used instead
  return {
    name: baseLoader.name,
    load: baseLoader.load,
    // Explicitly omit the schema property to avoid the Astro 6 warning
    // Our static schema in content.config.ts takes precedence anyway
  };
}
