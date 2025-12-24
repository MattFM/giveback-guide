#!/usr/bin/env node

/**
 * Validate MDX blog posts for common issues
 * 
 * Usage:
 *   node scripts/validate-blog-posts.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

const issues = [];
let totalPosts = 0;

function validateFrontmatter(filePath, content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    issues.push({
      file: path.basename(filePath),
      type: 'error',
      message: 'No frontmatter found',
    });
    return;
  }
  
  const frontmatter = match[1];
  const fileName = path.basename(filePath);
  
  // Required fields
  const requiredFields = ['title', 'description', 'slug', 'published', 'lastUpdated', 'tags'];
  
  for (const field of requiredFields) {
    if (!frontmatter.includes(`${field}:`)) {
      issues.push({
        file: fileName,
        type: 'error',
        message: `Missing required field: ${field}`,
      });
    }
  }
  
  // Check slug format
  const slugMatch = frontmatter.match(/slug:\s*["']([^"']+)["']/);
  if (slugMatch) {
    const slug = slugMatch[1];
    if (!/^[a-z0-9-]+$/.test(slug)) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `Slug should only contain lowercase letters, numbers, and hyphens: "${slug}"`,
      });
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `Slug should not start or end with hyphens: "${slug}"`,
      });
    }
  }
  
  // Check date format
  const dateFields = ['published', 'lastUpdated'];
  for (const field of dateFields) {
    const dateMatch = frontmatter.match(new RegExp(`${field}:\\s*(\\d{4}-\\d{2}-\\d{2})`));
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        issues.push({
          file: fileName,
          type: 'error',
          message: `Invalid date format for ${field}: ${dateStr}`,
        });
      }
    }
  }
  
  // Check description length
  const descMatch = frontmatter.match(/description:\s*["']([^"']+)["']/);
  if (descMatch) {
    const desc = descMatch[1];
    if (desc.length > 160) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `Description is too long (${desc.length} chars, recommended max 160)`,
      });
    }
    if (desc.length < 50) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `Description is too short (${desc.length} chars, recommended min 50)`,
      });
    }
  }
  
  // Check title length
  const titleMatch = frontmatter.match(/title:\s*["']([^"']+)["']/);
  if (titleMatch) {
    const title = titleMatch[1];
    if (title.length > 60) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `Title is too long (${title.length} chars, recommended max 60)`,
      });
    }
  }
  
  // Check tags
  const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/s);
  if (tagsMatch) {
    const tagsStr = tagsMatch[1].trim();
    if (tagsStr === '') {
      issues.push({
        file: fileName,
        type: 'warning',
        message: 'No tags specified (recommended: 2-5 tags)',
      });
    } else {
      const tagCount = (tagsStr.match(/["']/g) || []).length / 2;
      if (tagCount > 5) {
        issues.push({
          file: fileName,
          type: 'warning',
          message: `Too many tags (${tagCount}, recommended: 2-5)`,
        });
      }
    }
  }
}

function validateContent(filePath, content) {
  const fileName = path.basename(filePath);
  
  // Remove frontmatter for content checks
  const contentOnly = content.replace(/^---[\s\S]+?---\n/, '');
  
  // Check for images without alt text
  const imgRegex = /!\[\]\(/g;
  const emptyAltMatches = contentOnly.match(imgRegex);
  if (emptyAltMatches) {
    issues.push({
      file: fileName,
      type: 'error',
      message: `Found ${emptyAltMatches.length} image(s) without alt text (accessibility issue)`,
    });
  }
  
  // Check for images with generic alt text
  const genericAltRegex = /!\[(image|picture|photo|img)\]/gi;
  const genericAltMatches = contentOnly.match(genericAltRegex);
  if (genericAltMatches) {
    issues.push({
      file: fileName,
      type: 'warning',
      message: 'Found image(s) with generic alt text (should be descriptive)',
    });
  }
  
  // Check for broken component imports
  const componentRegex = /<(\w+)/g;
  let componentMatch;
  const usedComponents = new Set();
  
  while ((componentMatch = componentRegex.exec(contentOnly)) !== null) {
    usedComponents.add(componentMatch[1]);
  }
  
  const importRegex = /import\s+(\w+)\s+from/g;
  let importMatch;
  const importedComponents = new Set();
  
  while ((importMatch = importRegex.exec(content)) !== null) {
    importedComponents.add(importMatch[1]);
  }
  
  for (const component of usedComponents) {
    // Skip HTML elements
    if (component.toLowerCase() === component) continue;
    
    if (!importedComponents.has(component)) {
      issues.push({
        file: fileName,
        type: 'error',
        message: `Component <${component}> is used but not imported`,
      });
    }
  }
  
  // Check for http:// (should use https://)
  const httpMatches = contentOnly.match(/http:\/\/[^\s)]+/g);
  if (httpMatches) {
    issues.push({
      file: fileName,
      type: 'warning',
      message: `Found ${httpMatches.length} non-secure URL(s) (http://), consider using https://`,
    });
  }
  
  // Check for proper heading hierarchy
  const headings = contentOnly.match(/^#{1,6}\s+.+$/gm) || [];
  if (headings.length > 0) {
    const firstHeading = headings[0];
    const firstLevel = (firstHeading.match(/^#+/) || [''])[0].length;
    if (firstLevel !== 2) {
      issues.push({
        file: fileName,
        type: 'warning',
        message: `First heading should be h2 (##), found h${firstLevel}`,
      });
    }
  }
  
  // Check content length
  const wordCount = contentOnly.split(/\s+/).length;
  if (wordCount < 300) {
    issues.push({
      file: fileName,
      type: 'warning',
      message: `Content is quite short (${wordCount} words, recommended min 300)`,
    });
  }
}

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    validateFrontmatter(filePath, content);
    validateContent(filePath, content);
    totalPosts++;
  } catch (error) {
    issues.push({
      file: path.basename(filePath),
      type: 'error',
      message: `Failed to read or parse file: ${error.message}`,
    });
  }
}

function main() {
  console.log('🔍 Validating MDX blog posts...\n');
  
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(BLOG_DIR, file));
  
  if (files.length === 0) {
    console.log('⚠️  No MDX files found in blog directory');
    process.exit(0);
  }
  
  console.log(`Found ${files.length} MDX file(s)\n`);
  console.log('═'.repeat(70) + '\n');
  
  for (const file of files) {
    validateFile(file);
  }
  
  // Group issues by severity
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  
  // Print results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All posts look good!\n');
    console.log(`Validated ${totalPosts} post(s) with no issues.\n`);
    process.exit(0);
  }
  
  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach(({ file, message }) => {
      console.log(`   ${file}`);
      console.log(`      └─ ${message}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach(({ file, message }) => {
      console.log(`   ${file}`);
      console.log(`      └─ ${message}\n`);
    });
  }
  
  console.log('═'.repeat(70) + '\n');
  console.log(`Validated ${totalPosts} post(s)`);
  console.log(`  ${errors.length} error(s)`);
  console.log(`  ${warnings.length} warning(s)\n`);
  
  if (errors.length > 0) {
    console.log('⚠️  Please fix errors before deploying.\n');
    process.exit(1);
  } else {
    console.log('✅ No critical errors found. Review warnings and deploy when ready.\n');
    process.exit(0);
  }
}

main();
