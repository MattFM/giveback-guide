#!/usr/bin/env node

/**
 * Remove manual component imports from MDX blog posts
 * 
 * Since components are now provided globally via mdx-components.ts,
 * we no longer need individual import statements in each blog post.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = './src/content/blog';

// Patterns to remove
const IMPORT_PATTERNS = [
  /^import ResponsiveImage from ['"].*ResponsiveImage\.astro['"];?\s*$/gm,
  /^import AdBox from ['"].*AdBox\.astro['"];?\s*$/gm,
  /^import SupportBox from ['"].*SupportBox\.astro['"];?\s*$/gm,
];

async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf-8');
    let modified = false;
    
    // Remove each import pattern
    for (const pattern of IMPORT_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    }
    
    // Clean up extra blank lines (more than 2 consecutive newlines)
    if (modified) {
      content = content.replace(/\n{3,}/g, '\n\n');
      await writeFile(filePath, content, 'utf-8');
      console.log(`✓ Cleaned imports from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    const files = await readdir(BLOG_DIR);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    console.log(`Found ${mdxFiles.length} MDX files to process...\n`);
    
    let processedCount = 0;
    
    for (const file of mdxFiles) {
      const filePath = join(BLOG_DIR, file);
      const wasModified = await processFile(filePath);
      if (wasModified) processedCount++;
    }
    
    console.log(`\n✓ Complete! Processed ${processedCount} files.`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
